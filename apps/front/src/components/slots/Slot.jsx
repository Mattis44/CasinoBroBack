import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

const REEL_SYMBOLS = [
    "cards",
    "cherries",
    "clover",
    "club",
    "diamond",
    "heart",
    "lemon",
    "seven",
    "spade",
];

export default function Slot() {
    const canvasRef = useRef(null);

    useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const cols = 3;
    const rows = 3;

    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    const reelSize = 30;
    const reels = [];

    for (let col = 0; col < cols; col++) {
        const reel = [];
        for (let i = 0; i < reelSize; i++) {
            const img = new Image();
            img.src = `/assets/slots/${
                REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)]
            }.png`;
            reel.push(img);
        }
        reels.push(reel);
    }

    const offsets = [0, 0, 0];
    const speeds = [30, 30, 30];

    const targetStops = [4, 7, 2]; 
    const stopped = [false, false, false];

    function drawSymbol(img, col, yPos) {
        if (!img.complete) return;

        const maxScale = 0.6;
        const maxW = cellW * maxScale;
        const maxH = cellH * maxScale;
        const ratio = img.width / img.height;

        let drawW, drawH;

        if (maxW / maxH < ratio) {
            drawW = maxW;
            drawH = maxW / ratio;
        } else {
            drawH = maxH;
            drawW = maxH * ratio;
        }

        const x = col * cellW + (cellW - drawW) / 2;
        const y = yPos + (cellH - drawH) / 2;

        ctx.drawImage(img, x, y, drawW, drawH);
    }

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let col = 0; col < cols; col++) {

            if (!stopped[col]) {
                offsets[col] += speeds[col];

                if (speeds[col] > 2) speeds[col] -= 0.25;

                if (speeds[col] <= 2) {
                    const currentIndex = Math.round(offsets[col] / cellH) % reelSize;

                    if (currentIndex === targetStops[col]) {
                        stopped[col] = true;
                        speeds[col] = 0;
                        offsets[col] = targetStops[col] * cellH;
                    }
                }

                if (offsets[col] >= reelSize * cellH) {
                    offsets[col] = 0;
                }
            }

            for (let row = 0; row < rows + 1; row++) {
                const index = (Math.floor((offsets[col] / cellH) + row)) % reelSize;
                const symbol = reels[col][index];
                const y = row * cellH - (offsets[col] % cellH);
                drawSymbol(symbol, col, y);
            }
        }

        requestAnimationFrame(loop);
    }

    loop();
}, []);


    return (
        <Box
            sx={{
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
                flexGrow: 1,
                flexDirection: "column",
            }}
        >
            <Box
                sx={{
                    backgroundColor: (theme) => theme.palette.background.paper,
                    padding: 1,
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    textAlign: "center",
                }}
            >
                <Typography variant="subtitle1">
                    Total Payout: 50000
                </Typography>
            </Box>

            <Box
                sx={{
                    border: (theme) => `solid 10px ${theme.palette.background.paper}`,
                    borderRadius: "8px",
                    width: "85%",
                    height: "60%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={700}
                    height={350}
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                />
            </Box>
        </Box>
    );
}
