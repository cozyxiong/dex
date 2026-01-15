let provider;
let signer;
let currentAccount;

const ROUTER_ADDRESS = "0xF38dA4109850EfB43ade657B7C29e4a5E9F7701E";
const API_BASE = "http://localhost:4000";

const ROUTER_ABI = [
    "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) external returns (uint256,uint256,uint256)",
    "function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) external returns (uint256[] memory)",
    "function getAmountsOut(uint256,address[]) external view returns (uint256[] memory)"
];

const ERC20_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address,address) external view returns (uint256)",
    "function approve(address,uint256) external returns (bool)"
];

let swapFromToken = { address: "0xB758403751310bc9DBB3c68aCDCD068d84B71484", symbol: "Token A" };
let swapToToken = { address: "0x64D71dBa7428E7158aaf43F4eD06aEe0Dc1c5851", symbol: "Token B" };
let lpTokenA = { address: "0xB758403751310bc9DBB3c68aCDCD068d84B71484", symbol: "Token A" };
let lpTokenB = { address: "0x64D71dBa7428E7158aaf43F4eD06aEe0Dc1c5851", symbol: "Token B" };

function setStatus(text) {
    const el = document.getElementById("status");
    el.textContent = text || "";
}

function shortAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function showTab(key) {
    const swapView = document.getElementById("swapView");
    const poolView = document.getElementById("poolView");
    document.querySelectorAll(".tab-pill").forEach((el) => {
        el.classList.toggle("active", el.dataset.tab === key);
    });
    if (key === "swap") {
        swapView.style.display = "";
        poolView.style.display = "none";
    } else {
        swapView.style.display = "none";
        poolView.style.display = "";
    }
    const cardTitle = document.getElementById("cardTitle");
    const cardSubtitle = document.getElementById("cardSubtitle");
    if (key === "swap") {
        cardTitle.textContent = "Swap";
        cardSubtitle.textContent = "Swap tokens at constant product price";
    } else {
        cardTitle.textContent = "Pool";
        cardSubtitle.textContent = "Provide liquidity to earn LP tokens";
    }
    document.querySelectorAll(".nav-item").forEach((el) => {
        const navKey = el.dataset.nav;
        const activeKey = key === "swap" ? "swap" : "pool";
        el.classList.toggle("active", navKey === activeKey);
    });
}

async function connectWallet() {
    try {
        if (!window.ethereum) {
            setStatus("未检测到钱包，请安装 MetaMask");
            return;
        }
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });

        let net = await provider.getNetwork();
        if (net.chainId !== 11155111) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
                });
            } catch (error) {
                if (error && error.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia',
                                rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
                                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }]
                        });
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0xaa36a7' }]
                        });
                    } catch {
                        setStatus("添加或切换到 Sepolia 失败");
                        return;
                    }
                } else {
                    setStatus("请切换到 Sepolia 测试网");
                    return;
                }
            }
            provider = new ethers.providers.Web3Provider(window.ethereum);
            net = await provider.getNetwork();
        }

        signer = provider.getSigner();
        currentAccount = await signer.getAddress();

        const networkLabel = document.getElementById("networkLabel");
        networkLabel.textContent = net.name || "Network " + net.chainId;

        const accountShort = document.getElementById("accountShort");
        accountShort.textContent = shortAddress(currentAccount);

        const btn = document.getElementById("connect");
        btn.textContent = "已连接";
        btn.disabled = true;

        setStatus("钱包已连接");
        updateBalances();
    } catch (e) {
        setStatus("连接钱包失败");
    }
}

async function updateTokenInfo(token) {
    if (!signer || !token.address) return token;
    try {
        const c = new ethers.Contract(token.address, ERC20_ABI, signer);
        const symbol = await c.symbol();
        return { address: token.address, symbol };
    } catch {
        return token;
    }
}

async function updateBalances() {
    if (!signer || !currentAccount) return;
    try {
        if (swapFromToken.address) {
            const c = new ethers.Contract(swapFromToken.address, ERC20_ABI, signer);
            const b = await c.balanceOf(currentAccount);
            const t = document.getElementById("swapFromBalance");
            t.textContent = "Balance " + ethers.utils.formatEther(b);
        }
        if (swapToToken.address) {
            const c = new ethers.Contract(swapToToken.address, ERC20_ABI, signer);
            const b = await c.balanceOf(currentAccount);
            const t = document.getElementById("swapToBalance");
            t.textContent = "Balance " + ethers.utils.formatEther(b);
        }
        if (lpTokenA.address) {
            const c = new ethers.Contract(lpTokenA.address, ERC20_ABI, signer);
            const b = await c.balanceOf(currentAccount);
            const t = document.getElementById("lpABalance");
            t.textContent = "Balance " + ethers.utils.formatEther(b);
        }
        if (lpTokenB.address) {
            const c = new ethers.Contract(lpTokenB.address, ERC20_ABI, signer);
            const b = await c.balanceOf(currentAccount);
            const t = document.getElementById("lpBBalance");
            t.textContent = "Balance " + ethers.utils.formatEther(b);
        }
    } catch {
    }
}

async function updateSwapQuote() {
    try {
        const amountInStr = document.getElementById("swapAmountIn").value.trim();
        const hintEl = document.getElementById("swapHint");
        if (!amountInStr || !swapFromToken.address || !swapToToken.address || !provider) {
            document.getElementById("swapAmountOutMin").value = "";
            hintEl.textContent = "";
            return;
        }
        const amountInWei = ethers.utils.parseEther(amountInStr);
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
        const path = [swapFromToken.address, swapToToken.address];
        const amounts = await router.getAmountsOut(amountInWei, path);
        const out = amounts[amounts.length - 1];
        const outStr = ethers.utils.formatEther(out);
        document.getElementById("swapAmountOutMin").value = outStr;
        hintEl.textContent = "估算得到 " + outStr + " " + swapToToken.symbol;
    } catch (e) {
        document.getElementById("swapAmountOutMin").value = "";
        const hintEl = document.getElementById("swapHint");
        hintEl.textContent = "无法预估输出，可能尚未添加流动性";
    }
}

function applyTokenState() {
    document.getElementById("swapFromSymbol").textContent = swapFromToken.symbol;
    document.getElementById("swapFromAddress").textContent = shortAddress(swapFromToken.address);
    document.getElementById("swapToSymbol").textContent = swapToToken.symbol;
    document.getElementById("swapToAddress").textContent = shortAddress(swapToToken.address);
    document.getElementById("lpASymbol").textContent = lpTokenA.symbol;
    document.getElementById("lpAAddress").textContent = shortAddress(lpTokenA.address);
    document.getElementById("lpBSymbol").textContent = lpTokenB.symbol;
    document.getElementById("lpBAddress").textContent = shortAddress(lpTokenB.address);
}

async function promptTokenAddress() {
    const addr = window.prompt("输入代币地址");
    if (!addr) return "";
    return addr.trim();
}

async function selectSwapFromToken() {
    const addr = await promptTokenAddress();
    if (!addr) return;
    swapFromToken.address = addr;
    swapFromToken = await updateTokenInfo(swapFromToken);
    applyTokenState();
    updateBalances();
    updateSwapQuote();
}

async function selectSwapToToken() {
    const addr = await promptTokenAddress();
    if (!addr) return;
    swapToToken.address = addr;
    swapToToken = await updateTokenInfo(swapToToken);
    applyTokenState();
    updateBalances();
    updateSwapQuote();
}

async function selectLpTokenA() {
    const addr = await promptTokenAddress();
    if (!addr) return;
    lpTokenA.address = addr;
    lpTokenA = await updateTokenInfo(lpTokenA);
    swapFromToken = { address: addr, symbol: lpTokenA.symbol };
    applyTokenState();
    updateBalances();
    updateSwapQuote();
}

async function selectLpTokenB() {
    const addr = await promptTokenAddress();
    if (!addr) return;
    lpTokenB.address = addr;
    lpTokenB = await updateTokenInfo(lpTokenB);
    swapToToken = { address: addr, symbol: lpTokenB.symbol };
    applyTokenState();
    updateBalances();
    updateSwapQuote();
}

function switchSwapTokens() {
    const tmp = swapFromToken;
    swapFromToken = swapToToken;
    swapToToken = tmp;
    const inEl = document.getElementById("swapAmountIn");
    const outEl = document.getElementById("swapAmountOutMin");
    const tmpVal = inEl.value;
    inEl.value = outEl.value;
    outEl.value = tmpVal;
    applyTokenState();
    updateBalances();
    updateSwapQuote();
}

async function addLiquidity() {
    try {
        if (!signer) {
            setStatus("请先连接钱包");
            return;
        }
        if (!lpTokenA.address || !lpTokenB.address) {
            setStatus("请先选择流动性代币");
            return;
        }
        const amountA = document.getElementById("lpAmountA").value.trim();
        const amountB = document.getElementById("lpAmountB").value.trim();
        if (!amountA || !amountB) {
            setStatus("请填写完整的添加流动性参数");
            return;
        }
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
        const tokenAContract = new ethers.Contract(lpTokenA.address, ERC20_ABI, signer);
        const tokenBContract = new ethers.Contract(lpTokenB.address, ERC20_ABI, signer);
        const amountAWei = ethers.utils.parseEther(amountA);
        const amountBWei = ethers.utils.parseEther(amountB);

        setStatus("批准 Token A 授权");
        let tx = await tokenAContract.approve(ROUTER_ADDRESS, amountAWei);
        await tx.wait();

        setStatus("批准 Token B 授权");
        tx = await tokenBContract.approve(ROUTER_ADDRESS, amountBWei);
        await tx.wait();

        const deadline = Math.floor(Date.now() / 1000) + 1200;
        setStatus("发送添加流动性交易");
        tx = await router.addLiquidity(
            lpTokenA.address,
            lpTokenB.address,
            amountAWei,
            amountBWei,
            0,
            0,
            currentAccount,
            deadline
        );
        const receipt = await tx.wait();
        setStatus("添加流动性成功: " + receipt.transactionHash);
        updateBalances();
    } catch (e) {
        setStatus("添加流动性失败");
    }
}

async function swap() {
    try {
        if (!signer) {
            setStatus("请先连接钱包");
            return;
        }
        if (!swapFromToken.address || !swapToToken.address) {
            setStatus("请先选择兑换代币");
            return;
        }
        const amountIn = document.getElementById("swapAmountIn").value.trim();
        const amountOutMin = document.getElementById("swapAmountOutMin").value.trim();
        if (!amountIn || !amountOutMin) {
            setStatus("请填写完整的兑换参数");
            return;
        }
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
        const tokenInContract = new ethers.Contract(swapFromToken.address, ERC20_ABI, signer);
        const amountInWei = ethers.utils.parseEther(amountIn);
        const amountOutMinWei = ethers.utils.parseEther(amountOutMin);

        setStatus("批准输入代币授权");
        let tx = await tokenInContract.approve(ROUTER_ADDRESS, amountInWei);
        await tx.wait();

        const deadline = Math.floor(Date.now() / 1000) + 1200;
        const path = [swapFromToken.address, swapToToken.address];

        setStatus("发送兑换交易");
        tx = await router.swapExactTokensForTokens(
            amountInWei,
            amountOutMinWei,
            path,
            currentAccount,
            deadline
        );
        const receipt = await tx.wait();
        setStatus("兑换成功: " + receipt.transactionHash);
        updateBalances();
    } catch (e) {
        const msg = e && (e.reason || e.message || (e.error && e.error.message)) || "";
        if (msg.includes("INSUFFICIENT_LIQUIDITY")) {
            setStatus("兑换失败：池子流动性不足，请先添加流动性");
        } else if (msg.includes("insufficient funds")) {
            setStatus("兑换失败：钱包 ETH 余额不足");
        } else {
            setStatus("兑换失败");
        }
    }
}





function initEvents() {
    document.getElementById("connect").addEventListener("click", connectWallet);
    document.querySelectorAll(".nav-item").forEach((el) => {
        el.addEventListener("click", () => {
            showTab(el.dataset.nav);
        });
    });
    document.getElementById("swapFromTokenBtn").addEventListener("click", selectSwapFromToken);
    document.getElementById("swapToTokenBtn").addEventListener("click", selectSwapToToken);
    document.getElementById("lpTokenABtn").addEventListener("click", selectLpTokenA);
    document.getElementById("lpTokenBBtn").addEventListener("click", selectLpTokenB);
    document.getElementById("swapSwitch").addEventListener("click", switchSwapTokens);
    document.getElementById("btnAddLiquidity").addEventListener("click", addLiquidity);
    document.getElementById("btnSwap").addEventListener("click", swap);
    document.getElementById("swapAmountIn").addEventListener("input", updateSwapQuote);
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', async () => {
            try {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts && accounts.length > 0) {
                    signer = provider.getSigner();
                    currentAccount = accounts[0];
                    document.getElementById("accountShort").textContent = shortAddress(currentAccount);
                    updateBalances();
                } else {
                    currentAccount = undefined;
                    document.getElementById("accountShort").textContent = "";
                    const btn = document.getElementById("connect");
                    btn.textContent = "连接钱包";
                    btn.disabled = false;
                }
            } catch {
                setStatus("账户更新失败");
            }
        });
        window.ethereum.on('chainChanged', async () => {
            try {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                const net = await provider.getNetwork();
                document.getElementById("networkLabel").textContent = net.name || "Network " + net.chainId;
                updateBalances();
            } catch {
                setStatus("网络更新失败");
            }
        });
    }
}

function init() {
    if (typeof window.ethers === "undefined") {
        setStatus("无法加载 ethers 库，请允许 CDN 或更换浏览器");
        const btn = document.getElementById("connect");
        if (btn) {
            btn.disabled = true;
        }
        return;
    }
    applyTokenState();
    initEvents();
    showTab("swap");
}

window.addEventListener("load", init);
