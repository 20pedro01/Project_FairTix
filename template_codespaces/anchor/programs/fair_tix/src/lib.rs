use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::{
    instructions::{CreateMasterEditionV3CpiBuilder, CreateMetadataAccountV3CpiBuilder},
    types::DataV2,
};

// Program ID
declare_id!("F8ZN7PUv4kQCeVAmCCKsftX3XhycrPqiyqqTgyGtM6DJ");

#[program]
pub mod fair_tix {
    use super::*;

    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        base_price: u64,
        max_price: u64,
        royalty_percent: u8,
        max_tickets: u32,
        resale_cooldown: i64,
    ) -> Result<()> {
        let event = &mut ctx.accounts.event;
        event.organizer = *ctx.accounts.organizer.key;
        event.name = name;
        event.base_price = base_price;
        event.max_resale_price = max_price;
        event.royalty_percent = royalty_percent;
        event.max_tickets = max_tickets;
        event.tickets_sold = 0;
        event.resale_cooldown = resale_cooldown;
        event.bump = ctx.bumps.event;

        require!(royalty_percent <= 100, ErrorCode::InvalidRoyalty);
        require!(max_price >= base_price, ErrorCode::InvalidPriceRange);
        require!(max_tickets > 0, ErrorCode::InvalidTicketSupply);

        msg!("Evento NFT '{}' creado.", event.name);
        Ok(())
    }

    pub fn buy_ticket<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, BuyTicket<'info>>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        
        // 1. RECUPERAR ORGANIZADOR
        let organizer_acc = &ctx.remaining_accounts[3];
        require!(organizer_acc.key() == event.organizer, ErrorCode::Unauthorized);

        let ticket = &mut ctx.accounts.ticket;
        let clock = Clock::get()?;

        // 2. PAGO AL ORGANIZADOR
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: organizer_acc.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, event.base_price)?;

        // 3. MINT DEL NFT
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.ticket_mint.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            1,
        )?;

        // 4. RECUPERAR CUENTAS DE METADATOS
        let metadata_acc = &ctx.remaining_accounts[0];
        let master_edition_acc = &ctx.remaining_accounts[1];
        let metaplex_program_acc = &ctx.remaining_accounts[2];

        // 5. CREAR METADATOS
        CreateMetadataAccountV3CpiBuilder::new(metaplex_program_acc)
            .metadata(metadata_acc)
            .mint(&ctx.accounts.ticket_mint.to_account_info())
            .mint_authority(&ctx.accounts.buyer.to_account_info())
            .payer(&ctx.accounts.buyer)
            .update_authority(organizer_acc, true)
            .system_program(&ctx.accounts.system_program.to_account_info())
            .data(DataV2 {
                name: format!("{} Ticket #{}", event.name, event.tickets_sold + 1),
                symbol: "FTIX".to_string(),
                uri: "https://arweave.net/example-metadata-uri".to_string(),
                seller_fee_basis_points: (event.royalty_percent as u16) * 100,
                creators: None,
                collection: None,
                uses: None,
            })
            .is_mutable(true)
            .invoke()?;

        // 6. CREAR MASTER EDITION (Ajustado token_program para corregir 'token_program is not set')
        CreateMasterEditionV3CpiBuilder::new(metaplex_program_acc)
            .edition(master_edition_acc)
            .mint(&ctx.accounts.ticket_mint.to_account_info())
            .mint_authority(&ctx.accounts.buyer.to_account_info())
            .payer(&ctx.accounts.buyer)
            .update_authority(organizer_acc)
            .metadata(metadata_acc)
            .token_program(&ctx.accounts.token_program.to_account_info()) // FORZADO: REQUERIDO PARA MASTER EDITION
            .system_program(&ctx.accounts.system_program.to_account_info())
            .max_supply(0) 
            .invoke()?;

        // 7. INICIALIZAR ESTADO DEL TICKET
        ticket.owner = *ctx.accounts.buyer.key;
        ticket.event = event.key();
        ticket.price_paid = event.base_price;
        ticket.resale_count = 0;
        ticket.last_transfer_time = clock.unix_timestamp;
        ticket.is_used = false;
        ticket.mint = ctx.accounts.ticket_mint.key();
        ticket.bump = ctx.bumps.ticket;

        event.tickets_sold += 1;
        msg!("¡Ticket Comprado Exitosamente!");
        Ok(())
    }

    pub fn resell_ticket(ctx: Context<ResellTicket>, new_price: u64) -> Result<()> {
        let event = &ctx.accounts.event;
        let ticket = &mut ctx.accounts.ticket;
        let clock = Clock::get()?;

        require!(!ticket.is_used, ErrorCode::TicketAlreadyUsed);
        let time_since = clock.unix_timestamp.checked_sub(ticket.last_transfer_time).ok_or(ErrorCode::MathOverflow)?;
        require!(time_since > event.resale_cooldown, ErrorCode::ResaleTooSoon);
        require!(new_price <= event.max_resale_price, ErrorCode::MaxResalePriceExceeded);
        require!(new_price >= event.base_price, ErrorCode::PriceTooLow);
        require!(ticket.resale_count < 5, ErrorCode::TooManyResales);

        let mut seller_amount = new_price;
        if new_price > ticket.price_paid {
            let profit = new_price.checked_sub(ticket.price_paid).ok_or(ErrorCode::MathOverflow)?;
            let royalty = (profit.checked_mul(event.royalty_percent as u64).ok_or(ErrorCode::MathOverflow)?) / 100;
            seller_amount = new_price.checked_sub(royalty).ok_or(ErrorCode::MathOverflow)?;

            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.buyer.to_account_info(),
                        to: ctx.accounts.organizer.to_account_info(),
                    },
                ),
                royalty,
            )?;
        }

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
            ),
            seller_amount,
        )?;

        ticket.owner = *ctx.accounts.buyer.key;
        ticket.price_paid = new_price;
        ticket.resale_count += 1;
        ticket.last_transfer_time = clock.unix_timestamp;

        Ok(())
    }

    pub fn validate_ticket(ctx: Context<ValidateTicket>) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        require!(!ticket.is_used, ErrorCode::TicketAlreadyUsed);
        ticket.is_used = true;
        msg!("¡Ticket Validado!");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateEvent<'info> {
    #[account(
        init, 
        payer = organizer, 
        space = 8 + 32 + 64 + 8 + 8 + 1 + 4 + 4 + 8 + 1,
        seeds = [b"event", organizer.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub event: Account<'info, EventState>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub event: Box<Account<'info, EventState>>,
    #[account(
        init, 
        payer = buyer, 
        space = 8 + 32 + 32 + 8 + 1 + 8 + 1 + 32 + 1,
        seeds = [b"ticket", event.key().as_ref(), &event.tickets_sold.to_le_bytes()],
        bump
    )]
    pub ticket: Box<Account<'info, Ticket>>,

    #[account(
        init,
        payer = buyer,
        mint::decimals = 0,
        mint::authority = buyer,
        mint::freeze_authority = buyer,
    )]
    pub ticket_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = ticket_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ResellTicket<'info> {
    #[account(mut)]
    pub event: Account<'info, EventState>,
    #[account(
        mut, 
        has_one = owner, 
        has_one = event,
    )]
    pub ticket: Account<'info, Ticket>,
    /// CHECK: Esta cuenta se valida manualmente comparándola con el owner del ticket en 'has_one'
    #[account(mut)]
    pub owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, address = event.organizer)]
    pub organizer: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateTicket<'info> {
    pub event: Account<'info, EventState>,
    #[account(mut, has_one = event)]
    pub ticket: Account<'info, Ticket>,
    #[account(mut, address = event.organizer)]
    pub organizer: Signer<'info>,
}

#[account]
pub struct EventState {
    pub organizer: Pubkey,
    pub name: String,
    pub base_price: u64,
    pub max_resale_price: u64,
    pub royalty_percent: u8,
    pub max_tickets: u32,
    pub tickets_sold: u32,
    pub resale_cooldown: i64,
    pub bump: u8,
}

#[account]
pub struct Ticket {
    pub owner: Pubkey,
    pub event: Pubkey,
    pub price_paid: u64,
    pub resale_count: u8,
    pub last_transfer_time: i64,
    pub is_used: bool,
    pub mint: Pubkey, 
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("El precio de reventa excede el limite permitido.")]
    PriceTooHigh,
    #[msg("El Cooldown de reventa aun esta activo.")]
    ResaleTooSoon,
    #[msg("Este ticket ya ha superado el numero maximo de reventas.")]
    TooManyResales,
    #[msg("Este ticket ya ha sido validado.")]
    TicketAlreadyUsed,
    #[msg("No estas autorizado para realizar esta accion.")]
    Unauthorized,
    #[msg("Error matematico.")]
    MathOverflow,
    #[msg("Porcentaje de regalia invalido (0-100).")]
    InvalidRoyalty,
    #[msg("Supply maximo de tickets invalido.")]
    InvalidTicketSupply,
    #[msg("Rango de precios de reventa invalido.")]
    InvalidPriceRange,
    #[msg("El precio de reventa es demasiado bajo.")]
    PriceTooLow,
    #[msg("El precio de reventa excede el maximo permitido.")]
    MaxResalePriceExceeded,
}