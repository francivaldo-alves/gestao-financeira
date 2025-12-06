import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import jsQR from 'jsqr';

const ReceiptUpload = ({ onScanComplete }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const preprocessImage = (file) => {
        return new Promise((resolve, reject) => {
            setStatusText('Processando imagem...');
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize if too large (improves performance and avoids crashes on mobile)
                const MAX_WIDTH = 1024; // Reduced to 1024 for better mobile stability
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    setStatusText('Redimensionando...');
                    height = (MAX_WIDTH / width) * height;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Try to read QR Code from the resized image
                setStatusText('Verificando QR Code...');
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                let qrData = null;
                if (code) {
                    console.log("QR Code Found:", code.data);
                    qrData = code.data;
                }

                const data = imageData.data;
                // Grayscale & Contrast (for OCR)
                setStatusText('Otimizando para leitura...');
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Increase contrast
                    const factor = 1.3;
                    const color = factor * (avg - 128) + 128;
                    data[i] = color;
                    data[i + 1] = color;
                    data[i + 2] = color;
                }
                ctx.putImageData(imageData, 0, 0);
                resolve({
                    processedImage: canvas.toDataURL('image/jpeg', 0.8), // Lower quality slightly for speed
                    qrData
                });
            };
            img.onerror = (err) => reject(err);
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        setProgress(0);
        setStatusText('Iniciando...');

        try {
            // Pre-process image and check for QR
            const { processedImage, qrData } = await preprocessImage(file);

            setStatusText('Inicializando OCR (pode demorar)...');
            const result = await Tesseract.recognize(
                processedImage,
                'por',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setStatusText(`Lendo texto: ${Math.round(m.progress * 100)}%`);
                            setProgress(Math.round(m.progress * 100));
                        } else {
                            setStatusText(`Status: ${m.status}`);
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log('OCR Result:', text);
            setStatusText('Processando dados...');
            parseReceiptData(text, qrData);
        } catch (error) {
            console.error('OCR Error:', error);
            alert(`Erro ao ler a imagem: ${error.message || error}`);
        } finally {
            setScanning(false);
            setStatusText('');
            // Reset inputs to allow selecting the same file again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const parseReceiptData = (text, qrData) => {
        const lines = text.split('\n');
        let amount = '';
        let date = '';
        let description = '';
        let category = '';
        let paymentMethod = '';

        // Improved Regex patterns
        const dateRegex = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/;

        // Keywords for categorization
        const categories = {
            'alimentacao': ['restaurante', 'lanchonete', 'ifood', 'burger', 'pizza', 'sushi', 'padaria', 'mercado', 'atacadista', 'supermercado', 'food'],
            'transporte': ['uber', '99', 'taxi', 'posto', 'combustivel', 'gasolina', 'estacionamento'],
            'lazer': ['shopping', 'cinema', 'teatro', 'show', 'netflix', 'spotify', 'amazon', 'shopee', 'loja', 'magazine'],
            'saude': ['farmacia', 'drogaria', 'medico', 'hospital', 'clinica'],
            'moradia': ['luz', 'agua', 'energia', 'aluguel', 'condominio', 'internet', 'vivo', 'claro', 'tim', 'oi', 'net']
        };

        const paymentKeywords = {
            'pix': ['pix'],
            'card': ['cartao', 'credito', 'debito', 'visa', 'master'],
            'cash': ['dinheiro', 'especie'],
            'boleto': ['boleto']
        };

        const amountsFound = [];

        lines.forEach(line => {
            const lowerLine = line.toLowerCase();

            // Date Detection
            if (!date) {
                const dateMatch = line.match(dateRegex);
                if (dateMatch) {
                    let day = dateMatch[1];
                    let month = dateMatch[2];
                    let year = dateMatch[3];

                    if (year.length === 2) year = '20' + year;

                    if (parseInt(day) <= 31 && parseInt(month) <= 12) {
                        date = `${year}-${month}-${day}`;
                    }
                }
            }

            // Category Detection
            if (!category) {
                for (const [catKey, keywords] of Object.entries(categories)) {
                    if (keywords.some(k => lowerLine.includes(k))) {
                        category = catKey;
                        break;
                    }
                }
            }

            // Payment Method Detection
            if (!paymentMethod) {
                for (const [methodKey, keywords] of Object.entries(paymentKeywords)) {
                    if (keywords.some(k => lowerLine.includes(k))) {
                        paymentMethod = methodKey;
                        break;
                    }
                }
            }

            // Amount Detection
            const amountMatch = line.match(/(\d+[.,]\d{2})/);
            if (amountMatch) {
                let valStr = amountMatch[1].replace(/[^\d.,]/g, '');
                valStr = valStr.replace('.', '').replace(',', '.');
                let val = parseFloat(valStr);

                if (!isNaN(val) && val > 0 && val < 100000) {
                    let score = val;
                    if (lowerLine.includes('total') || lowerLine.includes('pagar') || lowerLine.includes('valor')) {
                        score += 1000000;
                    }
                    amountsFound.push({ val, score, line: lowerLine });
                }
            }
        });

        if (amountsFound.length > 0) {
            amountsFound.sort((a, b) => b.score - a.score);
            amount = amountsFound[0].val;
        }

        for (let line of lines) {
            const cleanLine = line.trim();
            if (cleanLine && cleanLine.length > 3 && !cleanLine.match(dateRegex) && isNaN(parseFloat(cleanLine.replace(',', '.')))) {
                if (!['cnpj', 'cpf', 'extrato', 'cupom', 'fiscal', 'ie:', 'inscri'].some(w => cleanLine.toLowerCase().includes(w))) {
                    description = cleanLine.substring(0, 30);
                    break;
                }
            }
        }

        if (qrData) {
            console.log("Processing QR Data:", qrData);
            if (!description) description = "Nota via QR Code";

            if (!amount && qrData.includes('|')) {
                const parts = qrData.split('|');
                for (const part of parts) {
                    if (part.match(/^\d+\.\d{2}$/)) {
                        amount = part;
                        break;
                    }
                }
            }
        }

        onScanComplete({
            amount: amount ? amount.toString() : '',
            date: date || new Date().toISOString().split('T')[0],
            description: description || 'Despesa detectada',
            category: category || '',
            paymentMethod: paymentMethod || ''
        });
    };

    return (
        <div className="mb-3">
            {/* Input for Camera (forces camera on mobile) */}
            <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="d-none"
            />

            {/* Input for Gallery (allows file selection) */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="d-none"
            />

            <div className="d-flex gap-2">
                <button
                    type="button"
                    onClick={() => cameraInputRef.current.click()}
                    className="btn btn-outline-primary w-50 d-flex align-items-center justify-content-center gap-2"
                    disabled={scanning}
                >
                    {scanning ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <i className="bi bi-camera-fill"></i>
                    )}
                    Tirar Foto
                </button>

                <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2"
                    disabled={scanning}
                >
                    <i className="bi bi-image"></i>
                    Galeria
                </button>
            </div>

            {scanning && (
                <div className="text-center mt-2">
                    <small className="text-muted">{statusText}</small>
                </div>
            )}
        </div>
    );
};

export default ReceiptUpload;
