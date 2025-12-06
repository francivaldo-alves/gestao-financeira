import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import jsQR from 'jsqr';

const ReceiptUpload = ({ onScanComplete }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Função auxiliar para ler a orientação EXIF (0x0112)
    const getOrientation = (file, callback) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const view = new DataView(event.target.result);
                if (view.getUint16(0, false) !== 0xFFD8) return callback(-2);
                let length = view.byteLength, offset = 2;
                while (offset < length) {
                    if (view.getUint16(offset + 2, false) <= 8) return callback(-1);
                    let marker = view.getUint16(offset, false);
                    offset += 2;
                    if (marker === 0xFFE1) {
                        if (view.getUint32(offset += 2, false) !== 0x45786966) return callback(-1);
                        let little = view.getUint16(offset += 6, false) === 0x4949;
                        offset += view.getUint32(offset + 4, little);
                        let tags = view.getUint16(offset, little);
                        offset += 2;
                        for (let i = 0; i < tags; i++)
                            if (view.getUint16(offset + (i * 12), little) === 0x0112)
                                return callback(view.getUint16(offset + (i * 12) + 8, little));
                    } else if ((marker & 0xFF00) !== 0xFF00) break;
                    else offset += view.getUint16(offset, false);
                }
                return callback(-1);
            } catch (err) {
                console.warn('Error reading EXIF, defaulting to NO-ROTATION:', err);
                return callback(-1);
            }
        };
        reader.onerror = () => {
            console.warn('FileReader error in getOrientation, defaulting to NO-ROTATION');
            return callback(-1);
        };
        reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
    };

    const preprocessImage = (file) => {
        return new Promise((resolve, reject) => {
            setStatusText('Processando imagem (orientação/resize)...');

            getOrientation(file, (orientation) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        setStatusText('Redimensionando imagem...');
                        URL.revokeObjectURL(img.src);

                        if (img.width === 0 || img.height === 0) {
                            return reject(new Error("Imagem inválida (dimensões zeradas)"));
                        }

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        const MAX_WIDTH = 1024;
                        let width = img.width;
                        let height = img.height;

                        if (width > MAX_WIDTH) {
                            height = (MAX_WIDTH / width) * height;
                            width = MAX_WIDTH;
                        }

                        // Ajustar dimensões do canvas baseado na orientação
                        if ([5, 6, 7, 8].indexOf(orientation) > -1) {
                            canvas.width = height;
                            canvas.height = width;
                        } else {
                            canvas.width = width;
                            canvas.height = height;
                        }

                        // Aplicar rotação
                        switch (orientation) {
                            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
                            case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
                            case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
                            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                            case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
                            case 7: ctx.transform(0, -1, -1, 0, height, width); break;
                            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
                            default: break;
                        }

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
                        // Otimização básica de contraste para OCR
                        // setStatusText('Otimizando para leitura...');
                        for (let i = 0; i < data.length; i += 4) {
                            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                            const factor = 1.3;
                            const color = factor * (avg - 128) + 128;
                            data[i] = color;
                            data[i + 1] = color;
                            data[i + 2] = color;
                        }
                        ctx.putImageData(imageData, 0, 0);
                        resolve({
                            processedImage: canvas.toDataURL('image/jpeg', 0.8),
                            qrData
                        });
                    } catch (err) {
                        console.error("Error processing image inside onload:", err);
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error("Falha ao carregar a imagem. Arquivo corrompido ou formato não suportado."));
                img.src = URL.createObjectURL(file);
            });
        });
    };


    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            setError("Arquivo muito grande (máximo 15MB). Por favor, escolha uma imagem menor.");
            return;
        }

        setScanning(true);
        setProgress(0);
        setStatusText('Lendo arquivo...');
        setError(null);

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
            const msg = error.message || (typeof error === 'string' ? error : 'Erro desconhecido ao processar imagem');
            setError(`Erro ao ler a imagem: ${msg}`);
        } finally {
            setScanning(false);
            setStatusText('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const parseReceiptData = (text, qrData) => {
        // Cleaning text: replace common OCR errors
        const cleanText = text
            .replace(/\|/g, '1') // Pipe to 1
            .replace(/O/g, '0')  // Big O to 0 (contextual, but safe for numbers)
            .replace(/o/g, '0'); // Little o to 0

        const lines = cleanText.split('\n');
        let amount = '';
        let date = '';
        let description = '';
        let category = '';
        let paymentMethod = '';

        // Improved Regex patterns
        // Date: Matches DD/MM/YYYY, DD-MM-YY, etc.
        const dateRegex = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/;

        // Amount: R$ 10,00, 10.00, 10,00 (flexible with spaces and currency symbol)
        // Look for lines with 'TOTAL', 'VALOR', 'PAGAR' specifically for high confidence
        const currencyRegex = /(?:R\$)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d{1,3}(?:,\d{3})*(?:\.\d{2}))/i;

        // Keywords for categorization
        const categories = {
            'alimentacao': ['restaurante', 'lanchonete', 'ifood', 'burger', 'pizza', 'sushi', 'padaria', 'mercado', 'atacadista', 'supermercado', 'food', 'buffet', 'grill'],
            'transporte': ['uber', '99', 'taxi', 'posto', 'combustivel', 'gasolina', 'estacionamento', 'aluguel', 'ipva'],
            'lazer': ['shopping', 'cinema', 'teatro', 'show', 'netflix', 'spotify', 'amazon', 'shopee', 'loja', 'magazine', 'livraria'],
            'saude': ['farmacia', 'drogaria', 'medico', 'hospital', 'clinica', 'exame', 'laboratorio', 'dentista'],
            'moradia': ['luz', 'agua', 'energia', 'aluguel', 'condominio', 'internet', 'vivo', 'claro', 'tim', 'oi', 'net', 'eletropaulo', 'sabesp']
        };

        const paymentKeywords = {
            'pix': ['pix'],
            'card': ['cartao', 'credito', 'debito', 'visa', 'master', 'elo', 'amex'],
            'cash': ['dinheiro', 'especie', 'troco'],
            'boleto': ['boleto', 'bank']
        };

        const amountsFound = [];

        lines.forEach(line => {
            const lowerLine = line.toLowerCase();

            // Fix common char errors in line for processing
            const safeLine = lowerLine.replace(/o/g, '0').replace(/l/g, '1');

            // Date Detection
            if (!date) {
                const dateMatch = safeLine.match(dateRegex);
                if (dateMatch) {
                    let day = dateMatch[1];
                    let month = dateMatch[2];
                    let year = dateMatch[3];

                    // Year normalization
                    if (year.length === 2) year = '20' + year;

                    // Basic validation
                    if (parseInt(day) >= 1 && parseInt(day) <= 31 && parseInt(month) >= 1 && parseInt(month) <= 12) {
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
            // Prioritize lines with "Total"
            if (lowerLine.includes('total') || lowerLine.includes('pagar') || lowerLine.includes('valor')) {
                const amountMatch = line.match(currencyRegex);
                if (amountMatch) {
                    // Extract number, careful with thousands separators
                    let valStr = amountMatch[1];
                    // Normalize to dot decimal
                    if (valStr.includes(',') && valStr.includes('.')) {
                        // mixed case like 1.000,00 -> remove dot, replace comma
                        valStr = valStr.replace(/\./g, '').replace(',', '.');
                    } else if (valStr.includes(',')) {
                        valStr = valStr.replace(',', '.');
                    }

                    let val = parseFloat(valStr);
                    if (!isNaN(val)) {
                        amountsFound.push({ val, score: 100, line: lowerLine });
                    }
                }
            } else {
                // Fallback: look for generic currency patterns
                const amountMatch = line.match(currencyRegex);
                if (amountMatch) {
                    let valStr = amountMatch[1].replace(/\./g, '').replace(',', '.'); // simplified assumption for fallback
                    // Try smarter parsing if it fails
                    if (amountMatch[1].includes(',')) {
                        valStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
                    }

                    let val = parseFloat(valStr);
                    if (!isNaN(val) && val > 0 && val < 50000) {
                        amountsFound.push({ val, score: 1, line: lowerLine });
                    }
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

            {error && (
                <div className="alert alert-danger alert-dismissible fade show p-2 small mb-2" role="alert">
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                        <div>{error}</div>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" style={{ padding: '0.75rem' }}></button>
                </div>
            )}

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
