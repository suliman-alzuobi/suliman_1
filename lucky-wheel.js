import { createCanvas, loadImage } from 'canvas';
import GIFEncoder from 'gifencoder';
import { Readable } from 'stream';

export async function createLuckyWheelGif(winners, selectedWinnerIndex, avatarUrl) {
    const selectedWinner = winners[selectedWinnerIndex];
    winners = [...winners.filter((e, i) => i !== selectedWinnerIndex)];
    winners.push(selectedWinner);
    winners = winners.reverse();

    const numSegments = winners.length;
    const canvasWidth = 500; // زيادة حجم الكانفاس
    const canvasHeight = 500;
    const wheelRadius = 230; // زيادة حجم العجلة
    const centerRadius = 50; // زيادة حجم الدائرة المركزية

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

            // خلفية محيطية للعجلة
            const gradient = ctx.createRadialGradient(
                canvasWidth/2, canvasHeight/2, wheelRadius-50,
                canvasWidth/2, canvasHeight/2, wheelRadius+20
            );
            gradient.addColorStop(0, '#2C3E50');
            gradient.addColorStop(1, '#1a1a1a');
            
            ctx.beginPath();
            ctx.arc(canvasWidth/2, canvasHeight/2, wheelRadius+20, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // رسم العجلة الرئيسية
            ctx.beginPath();
            ctx.arc(canvasWidth/2, canvasHeight/2, wheelRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333';
            ctx.stroke();

            // رسم الأقسام
            for (let i = 0; i < numSegments; i++) {
                ctx.save();
                ctx.translate(canvasWidth/2, canvasHeight/2);

                const segmentAngle = (i * 2 * Math.PI) / numSegments + rotation;
                ctx.rotate(segmentAngle);

                // رسم القسم مع التدرج
                const segmentGradient = ctx.createLinearGradient(0, 0, wheelRadius, 0);
                const color = winners[i].color;
                segmentGradient.addColorStop(0, shadeColor(color, 20));
                segmentGradient.addColorStop(1, color);

                ctx.fillStyle = segmentGradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(wheelRadius, 0);
                ctx.arc(0, 0, wheelRadius, 0, (2 * Math.PI) / numSegments);
                ctx.fill();
                
                // إضافة حدود للأقسام
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // تحسين النص
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                const textRadius = wheelRadius / 1.5;
                ctx.save();
                ctx.rotate(Math.PI / numSegments);
                // تقسيم النص الطويل إلى سطرين
                const words = winners[i].value.split(' ');
                if (words.length > 1 && words[0].length + words[1].length > 10) {
                    ctx.fillText(words[0], textRadius, -10);
                    ctx.fillText(words.slice(1).join(' '), textRadius, 10);
                } else {
                    ctx.fillText(winners[i].value, textRadius, 0);
                }
                ctx.restore();

                ctx.restore();
            }

            // رسم الحافة الخارجية المضيئة
            ctx.beginPath();
            ctx.arc(canvasWidth/2, canvasHeight/2, wheelRadius+2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 4;
            ctx.stroke();

            // رسم الدائرة المركزية
            const centerGradient = ctx.createRadialGradient(
                canvasWidth/2, canvasHeight/2, 0,
                canvasWidth/2, canvasHeight/2, centerRadius
            );
            centerGradient.addColorStop(0, '#fff');
            centerGradient.addColorStop(1, '#ddd');

            ctx.beginPath();
            ctx.arc(canvasWidth/2, canvasHeight/2, centerRadius, 0, Math.PI * 2);
            ctx.fillStyle = centerGradient;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.stroke();

            // رسم صورة المستخدم
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvasWidth/2, canvasHeight/2, centerRadius-5, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImage, 
                canvasWidth/2 - (centerRadius-5), 
                canvasHeight/2 - (centerRadius-5), 
                (centerRadius-5) * 2, 
                (centerRadius-5) * 2
            );
            ctx.restore();

            // رسم المؤشر
            ctx.drawImage(pinImage, 
                (canvasWidth/2) - 20, 
                canvasHeight/2 - wheelRadius - 30, 
                40, 40
            );
        }

        function shadeColor(color, percent) {
            let R = parseInt(color.substring(1,3),16);
            let G = parseInt(color.substring(3,5),16);
            let B = parseInt(color.substring(5,7),16);

            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);

            R = (R<255)?R:255;
            G = (G<255)?G:255;
            B = (B<255)?B:255;

            const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
            const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
            const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

            return "#"+RR+GG+BB;
        }

        // حركة العجلة
        const minValue = 4.50294947014537 - (0.28- parseInt(`0.${winners.length}`)) ;
        const maxValue = 4.50294947014537 + (0.28- parseInt(`0.${winners.length}`)) ;
        const targetAngle = Math.random() * (maxValue - minValue) + minValue;
        
        const fullRotations = 2; // زيادة عدد الدورات
        const totalRotation = fullRotations * 2 * Math.PI + targetAngle;

        const decelerationFrames = 15; // زيادة عدد الإطارات للحركة أكثر سلاسة
        for (let i = 0; i < decelerationFrames; i++) {
            const t = i / decelerationFrames;
            const easedT = easeOutQuad(t);
            const rotation = totalRotation - (totalRotation - targetAngle) * easedT;
            drawWheel(rotation);
            encoder.addFrame(ctx);
        }

        // الإطار النهائي
        drawWheel(targetAngle);
        encoder.addFrame(ctx);

        // إطارات إضافية للنتيجة النهائية
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
