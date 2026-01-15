# DEX Example Project

A simple decentralized exchange example with:

- Smart contracts managed and built with Foundry
- Node.js backend API reading on-chain pairs
- Simple web UI for Swap and Add Liquidity


## Directory

- contracts/
  - DexFactory.sol
  - DexPair.sol
  - DexRouter.sol
  - DexERC20.sol
  - interfaces/
  - libraries/
  - tokens/ (TestToken, WETH)
- backend/
  - index.js
- frontend/
  - index.html
  - app.js
  - style.css


## Requirements

- Node.js 16+
- Foundry (forge)

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```


## Contracts (Sepolia via Foundry)

### Build & Test

```bash
forge build
forge test
```

### Environment Variables

Root `.env`:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

Foundry config in `foundry.toml`:

```toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
```

### Deploy

```bash
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast
```

The script prints:

- Deployer
- WETH
- DexFactory
- DexRouter
- TokenA / TokenB


## Backend (Node.js API)

Responsibilities:

- Connect to DexFactory on-chain
- Provide pairs list and pair details

### Install

```bash
cd backend
npm install
```

### Environment

`backend/.env`:

```env
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
FACTORY_ADDRESS=0xF7f4629Acb75e191b718D66FA7d5Bb8806945FEF
ROUTER_ADDRESS=0xF38dA4109850EfB43ade657B7C29e4a5E9F7701E
WETH_ADDRESS=0xE24BaC610e68891Fd99F44F1d278673ca46BdD6e
TOKEN_A_ADDRESS=0xB758403751310bc9DBB3c68aCDCD068d84B71484
TOKEN_B_ADDRESS=0x64D71dBa7428E7158aaf43F4eD06aEe0Dc1c5851
PORT=4000
```

### Run

```bash
node index.js
```

Endpoints:

- GET /health
- GET /pairs
- GET /pair/:address


## Frontend (Simple Web UI)

Located in `frontend/`, built with HTML/CSS/JS and ethers.js CDN.

### Features

- Top navigation toggles Swap / Pool
- Wallet connection requests Sepolia (adds network if missing)
- Auto-quote: `getAmountsOut` fills To amount from From amount
- Add Liquidity pre-fills Token A/B addresses

### Config

In [app.js](file:///d:/SolidityProject/dex/frontend/app.js):

```js
const ROUTER_ADDRESS = "0xF38dA4109850EfB43ade657B7C29e4a5E9F7701E";
const API_BASE = "http://localhost:4000";
```

ethers CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>
```

### Run

```bash
npx http-server frontend -p 8080 --cors
```

Open `http://127.0.0.1:8080`.

### Flow

1. Deploy contracts to Sepolia and record addresses
2. Configure `backend/.env` and run backend
3. Update frontend `ROUTER_ADDRESS`
4. Open frontend and connect MetaMask (Sepolia)
5. Go to Pool, input Token A/B amounts, Add Liquidity
6. Go to Swap, input From amount, confirm Swap


## Notes

- Example scripts and test tokens are for testing only
- Keep your private key safe and never commit it
