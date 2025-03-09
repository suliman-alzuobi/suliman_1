import { createCanvas, loadImage } from 'canvas';
import GIFEncoder from 'gifencoder';
import { Readable } from 'stream';

export async function createLuckyWheelGif(winners, selectedWinnerIndex, avatarUrl) {
    const selectedWinner = winners[selectedWinnerIndex];
    winners = [...winners.filter((e, i) => i !== selectedWinnerIndex)];
    winners.push(selectedWinner);
    winners = winners.reverse();

    const numSegments = winners.length;
    const canvasWidth = 500;
    const canvasHeight = 500;
    const wheelRadius = 230;
    const centerRadius = 50;

    try {
        const [avatarImage, pinImage] = await Promise.all([
            loadImage(avatarUrl),
            loadImage("pin.png")
        ]);

        const encoder = new GIFEncoder(canvasWidth, canvasHeight);
        const writableStream = new Readable().wrap(encoder.createWriteStream({}));

        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(50);
        encoder.setQuality(10);
        encoder.setTransparent();

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        function drawWheel(rotation) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.beginPath();
            ctx.arc(canvasWidth/2, canvasHeight/2, wheelRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333';
            ctx.stroke();

            for (let i = 0; i < numSegments; i++) {
                ctx.save();
                ctx.translate(canvasWidth/2, canvasHeight/2);
                const segmentAngle = (i * 2 * Math.PI) / numSegments + rotation;
                ctx.rotate(segmentAngle);
                
                ctx.fillStyle = winners[i].color;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(wheelRadius, 0);
                ctx.arc(0, 0, wheelRadius, 0, (2 * Math.PI) / numSegments);
                ctx.fill();
                
                ctx.restore();
            }

            ctx.save();
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.arc(0, 0, centerRadius - 5, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImage, - (centerRadius - 5), - (centerRadius - 5), (centerRadius - 5) * 2, (centerRadius - 5) * 2);
            ctx.restore();

            ctx.drawImage(pinImage, (canvasWidth/2) - 20, canvasHeight/2 - wheelRadius - 30, 40, 40);
        }

        const totalRotation = 4 * 2 * Math.PI + (Math.random() * (0.5 - 0.3) + 0.3);
        const decelerationFrames = 20;
        for (let i = 0; i < decelerationFrames; i++) {
            const t = i / decelerationFrames;
            const easedT = easeOutQuad(t);
            const rotation = totalRotation - (totalRotation - 0) * easedT;
            drawWheel(rotation);
            encoder.addFrame(ctx);
        }

        drawWheel(0);
        encoder.addFrame(ctx);
        for (let i = 0; i < 10; i++) {
            encoder.addFrame(ctx);
        }

        encoder.finish();

        return await new Promise((resolve, reject) => {
            const chunks = [];
            writableStream.on('data', chunk => chunks.push(chunk));
            writableStream.on('end', () => resolve(Buffer.concat(chunks)));
            writableStream.on('error', reject);
        });

    } catch (error) {
        console.error('Error creating lucky wheel GIF:', error);
        throw error;
    }
}

function easeOutQuad(t) {
    return t * (2 - t);
}
