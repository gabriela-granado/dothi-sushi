# Pedidos DoThi Sushi - Project TODO

## Database & Backend
- [x] Design and implement orders table schema with id, customer name, dish, payment method, status, and timestamp
- [x] Create database migration SQL and apply via webdev_execute_sql
- [x] Implement order query helpers in server/db.ts
- [x] Create tRPC procedures for order CRUD operations (create, list, update status, delete)
- [x] Write vitest tests for order procedures

## Frontend - Layout & Navigation
- [x] Customize DashboardLayout for Japanese/sushi restaurant aesthetic
- [x] Set up sidebar navigation with links to Orders and Dashboard
- [x] Configure dark theme with red and white accent colors in index.css
- [x] Ensure responsive design across all screen sizes

## Frontend - Order Management Features
- [x] Create order registration form component with customer name, dish, payment method, and status fields
- [x] Build orders listing page with table showing all order details
- [x] Implement status badge component with color coding (Pending, Preparing, Ready, Delivered)
- [x] Create order deletion functionality with confirmation dialog
- [x] Implement order status update functionality
- [x] Add empty state handling for orders list

## Styling & Polish
- [x] Apply Japanese-inspired dark theme (dark base with red and white accents)
- [x] Style status badges with distinct colors for each state
- [x] Ensure consistent spacing and typography throughout
- [x] Test responsive layout on mobile, tablet, and desktop

## Testing & Delivery
- [x] Write and run vitest tests for all procedures
- [x] Test order creation, listing, status updates, and deletion flows
- [x] Verify database integration and data persistence
- [x] Create final checkpoint before delivery


## Painel do Sushiman (Kitchen Operator Panel)
- [x] Criar procedimento tRPC para buscar pedidos pendentes/preparando
- [x] Implementar procedimento para atualizar status do pedido para "Pronto"
- [x] Criar página do painel da cozinha com polling automático a cada 10 segundos
- [x] Exibir pedidos em ordem FIFO (cronológica)
- [x] Adicionar botão "Marcar como Pronto" para cada pedido
- [x] Adicionar indicadores visuais para novos pedidos
- [x] Adicionar animação ao receber novo pedido
- [x] Testar funcionalidade de atualização automática
- [x] Testar atualização de status do pedido
