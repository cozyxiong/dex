const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const FACTORY_ABI = [
    "function allPairsLength() external view returns (uint256)",
    "function allPairs(uint256) external view returns (address)",
    "function getPair(address,address) external view returns (address)",
];

const PAIR_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112,uint112,uint32)",
];

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

app.get("/pairs", async (req, res) => {
    try {
        if (!FACTORY_ADDRESS) {
            return res.status(400).json({ error: "FACTORY_ADDRESS not set" });
        }

        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
        const length = await factory.allPairsLength();
        const max = Math.min(length.toNumber(), 50);

        const list = [];
        for (let i = 0; i < max; i++) {
            const pairAddress = await factory.allPairs(i);
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const [token0, token1] = await Promise.all([pair.token0(), pair.token1()]);
            const [reserve0, reserve1] = await pair.getReserves();
            list.push({
                index: i,
                address: pairAddress,
                token0,
                token1,
                reserve0: reserve0.toString(),
                reserve1: reserve1.toString(),
            });
        }

        res.json(list);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "internal error" });
    }
});

app.get("/pair/:address", async (req, res) => {
    try {
        const pairAddress = req.params.address;
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [token0, token1] = await Promise.all([pair.token0(), pair.token1()]);
        const [reserve0, reserve1, ts] = await pair.getReserves();
        res.json({
            address: pairAddress,
            token0,
            token1,
            reserve0: reserve0.toString(),
            reserve1: reserve1.toString(),
            blockTimestampLast: ts,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "internal error" });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});

