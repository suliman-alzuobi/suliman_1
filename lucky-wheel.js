import { createCanvas, loadImage } from 'canvas';
import GIFEncoder from 'gifencoder';
import { Readable } from 'stream';

export async function createLuckyWheelGif(winners, selectedWinnerIndex, avatarUrl) {
    const selectedWinner = winners[selectedWinnerIndex];
    winners = [...winners.filter((e, i) => i !== selectedWinnerIndex)];
    winners.push(selectedWinner);
    winners = winners.reverse();

    const numSegments = winners.length;
    const canvasSize = 500;
    const wheelRadius = 230;
    const centerRadius = 50;

    try {
        const [avatarImage, pinImage] = await Promise.all([
            loadImage(avatarUrl),
            loadImage("pin.png")
        ]);

        const encoder = new GIFEncoder(canvasSize, canvasSize);
        const writableStream = new Readable().wrap(encoder.createWriteStream({}));

        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(50);
        encoder.setQuality(10);

        const canvas = createCanvas(canvasSize, canvasSize);
        const ctx = canvas.getContext('2d');

        function drawWheel(rotation) {
            ctx.clearRect(0, 0, canvasSize, canvasSize);

            // رسم العجلة
            ctx.beginPath();
            ctx.arc(canvasSize / 2, canvasSize / 2, wheelRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333';
            ctx.stroke();

            // رسم الأقسام
            for (let i = 0; i < numSegments; i++) {
                ctx.save();
                ctx.translate(canvasSize / 2, canvasSize / 2);
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

            // رسم صورة المستخدم في المنتصف
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvasSize / 2, canvasSize / 2, centerRadius - 5, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                avatarImage,
                canvasSize / 2 - (centerRadius - 5),
                canvasSize / 2 - (centerRadius - 5),
                (centerRadius - 5) * 2,
                (centerRadius - 5) * 2
            );
            ctx.restore();

            // رسم المؤشر
            ctx.drawImage(pinImage, (canvasSize / 2) - 20, canvasSize / 2 - wheelRadius - 30, 40, 40);
        }

        // تحديد زاوية التوقف
        const winnerAngle = (2 * Math.PI / numSegments) * selectedWinnerIndex;

        // زيادة عدد الدورات لإعطاء تأثير حقيقي
        const totalRotations = 5; // زيادة عدد الدورات الأولية
        const targetRotation = totalRotations * Math.PI * 2 + winnerAngle;

        const frames = 40; // عدد الإطارات
        for (let i = 0; i <= frames; i++) {
            const progress = i / frames;
            const easedProgress = easeOutQuad(progress);
            const currentRotation = targetRotation * easedProgress;
            drawWheel(currentRotation);
            encoder.addFrame(ctx);
        }

        // تثبيت العجلة على الجائزة الفائزة
        for (let i = 0; i < 10; i++) {
            drawWheel(targetRotation);
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

// دالة التباطؤ التدريجي
function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}
