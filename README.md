# DEX 示例项目

一个仿照 Uniswap V2 设计的去中心化交易所示例，包含：

- 使用 Foundry 管理和编译的智能合约
- 提供链上交易对信息的 Node.js 后端 API
- 仿 Uniswap UI 的前端页面（仅顶部导航切换），支持 Swap、添加流动性


## 目录结构

- contracts/ 合约源码
  - DexFactory.sol
  - DexPair.sol
  - DexRouter.sol
  - DexERC20.sol
  - interfaces/ 基础接口定义
  - libraries/ 工具库
  - tokens/ 测试代币与 WETH
- script/
  - Deploy.s.sol 合约部署脚本（Foundry）
- test/
  - Dex.t.sol 简单集成测试
- backend/
  - index.js 后端服务入口
  - package.json 后端依赖声明
- frontend/
  - index.html 仿 Uniswap 风格 UI
  - app.js 前端逻辑
- foundry.toml Foundry 配置


## 环境准备

需要安装：

- Node.js 16+
- Foundry（包含 forge）

安装 Foundry：

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```


## 合约：使用 Foundry（Sepolia）

### 编译与测试

```bash
forge build
forge test
```

### 环境变量

项目根目录 `.env`：

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=0x你的私钥
ETHERSCAN_API_KEY=你的EtherscanKey
```

Foundry 配置在 `foundry.toml` 中已加入：

```toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
```

### 部署

运行部署脚本：

```bash
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast
```

脚本会部署并输出：

- Deployer 地址
- WETH 地址
- DexFactory 地址
- DexRouter 地址
- TokenA、TokenB 地址


## 后端：Node.js API

职责：

- 连接链上 DexFactory
- 提供交易对列表 / 交易对详情接口

### 安装依赖

```bash
cd backend
npm install
```

### 配置环境变量

`backend/.env`：

```env
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
FACTORY_ADDRESS=0x你的DexFactory地址
ROUTER_ADDRESS=0x你的DexRouter地址
WETH_ADDRESS=0x你的WETH地址
TOKEN_A_ADDRESS=0x你的TokenA地址
TOKEN_B_ADDRESS=0x你的TokenB地址
PORT=4000
```

### 启动后端服务

```bash
node index.js
```

接口：

- GET /health
- GET /pairs
- GET /pair/:address


## 前端：仿 Uniswap UI

位于 `frontend/`，使用 HTML + CSS + JS + ethers.js CDN。

### 关键特性

- 仅顶部导航切换 Swap / Pool
- 连接钱包时自动检测并切换到 Sepolia（必要时自动添加网络）
- From 输入数量自动调用 `getAmountsOut` 估算 To 数量
- 添加流动性默认预填部署出的 Token A/B 地址

### 配置

在 [app.js](file:///d:/SolidityProject/dex/frontend/app.js) 中设置：

```js
const ROUTER_ADDRESS = "0x你的Router地址";
const API_BASE = "http://localhost:4000";
```

ethers CDN 使用：

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>
```

### 启动前端

```bash
npx http-server frontend -p 8080 --cors
```

访问 `http://127.0.0.1:8080`。

### 使用流程

1. 使用部署脚本将合约部署到 Sepolia，并记录地址
2. 配置 `backend/.env` 的 RPC 和各合约地址，启动后端
3. 修改前端 `ROUTER_ADDRESS`
4. 打开前端页面，连接 MetaMask（Sepolia）
5. 切到 Pool，输入 Token A/B 数量，添加流动性
6. 切到 Swap，输入 From 数量，自动生成 To 数量，点击 Swap


## 注意事项

- 示例脚本及测试代币仅用于测试环境，不要用于生产资金场景
- 你的私钥仅用于部署与测试，请妥善保管，避免泄露
