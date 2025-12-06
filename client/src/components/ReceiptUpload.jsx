import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

const ReceiptUpload = ({ onScanComplete }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const preprocessImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Grayscale & Contrast
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Increase contrast
                    const factor = 1.2; // Contrast factor
                    const color = factor * (avg - 128) + 128;
                    data[i] = color;     // Red
                    data[i + 1] = color; // Green
                    data[i + 2] = color; // Blue
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        setProgress(0);

        try {
            // Pre-process image for better OCR
            const processedImage = await preprocessImage(file);

            const result = await Tesseract.recognize(
                processedImage,
                'por', // Portuguese
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log('OCR Result:', text);
            parseReceiptData(text);
        } catch (error) {
            console.error('OCR Error:', error);
            alert('Erro ao ler a imagem. Tente novamente com uma imagem mais clara.');
        } finally {
            setScanning(false);
        }
    };

    const parseReceiptData = (text) => {
        const lines = text.split('\n');
        let amount = '';
        let date = '';
        let description = '';
        let category = '';

        // Improved Regex patterns
        const dateRegex = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/;

        // Keywords for categorization
        const categories = {
            'food': ['restaurante', 'lanchonete', 'ifood', 'burger', 'pizza', 'sushi', 'padaria', 'mercado', 'atacadista'],
            'transport': ['uber', '99', 'taxi', 'posto', 'combustivel', 'gasolina', 'estacionamento'],
            'shopping': ['loja', 'magazine', 'amazon', 'shopee', 'shopping'],
            'health': ['farmacia', 'drogaria', 'medico', 'hospital', 'clinica'],
            'services': ['vivo', 'claro', 'tim', 'oi', 'net', 'internet', 'luz', 'agua', 'energia']
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

                    // Basic validation
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

            // Amount Detection
            // Look for numbers with 2 decimal places
            const amountMatch = line.match(/(\d+[.,]\d{2})/);
            if (amountMatch) {
                // Clean string: remove non-numeric except . and ,
                let valStr = amountMatch[1].replace(/[^\d.,]/g, '');
                // Normalize: 1.000,00 -> 1000.00
                valStr = valStr.replace('.', '').replace(',', '.');

                let val = parseFloat(valStr);

                // Filter out unlikely amounts (e.g., dates misread as amounts, phone numbers)
                if (!isNaN(val) && val > 0 && val < 100000) {
                    // Boost score if line contains "Total"
                    let score = val;
                    if (lowerLine.includes('total') || lowerLine.includes('pagar') || lowerLine.includes('valor')) {
                        score += 1000000; // High priority
                    }
                    amountsFound.push({ val, score, line: lowerLine });
                }
            }
        });

        // Select best amount
        if (amountsFound.length > 0) {
            amountsFound.sort((a, b) => b.score - a.score);
            amount = amountsFound[0].val;
        }

        // Description: First meaningful line
        for (let line of lines) {
            const cleanLine = line.trim();
            if (cleanLine && cleanLine.length > 3 && !cleanLine.match(dateRegex) && isNaN(parseFloat(cleanLine.replace(',', '.')))) {
                // Ignore common receipt header words
                if (!['cnpj', 'cpf', 'extrato', 'cupom', 'fiscal'].some(w => cleanLine.toLowerCase().includes(w))) {
                    description = cleanLine.substring(0, 30);
                    break;
                }
            }
        }

        onScanComplete({
            amount: amount ? amount.toString() : '',
            date: date || new Date().toISOString().split('T')[0], // Default to today if not found
            description: description || 'Despesa detectada',
            category: category || ''
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
                    <small className="text-muted">Lendo nota... {progress}%</small>
                </div>
            )}
        </div>
    );
};

export default ReceiptUpload;
