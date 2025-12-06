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

                        const MAX_WIDTH = 2048; // Increased for better OCR/QR details
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
                        // Binarization (Thresholding) for Thermal Receipts
                        // Converts to Grayscale then Black & White
                        for (let i = 0; i < data.length; i += 4) {
                            // Grayscale (Luma coding)
                            const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);

                            // Threshold: if darker than 160, make it pure black (0), else pure white (255)
                            // Thermal text is usually dark gray on light gray/yellow background
                            const threshold = 160;
                            const color = avg < threshold ? 0 : 255;

                            data[i] = color;     // Red
                            data[i + 1] = color; // Green
                            data[i + 2] = color; // Blue
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
        // 1. Initial Cleaning
        const rawLines = text.split('\n');

        // Data containers
        const amountsFound = [];
        let dateCandidate = '';
        let description = '';
        let category = '';
        let paymentMethod = '';

        // 2. Regex Definitions

        // Date: Robust matching for dd/mm/yyyy with OCR error tolerance (e.g., l2/0l/2025)
        // Matches separators: / - . 
        const dateRegex = /(\d{2}|[IlO]{2})[\/\-\.](\d{2}|[IlO]{2})[\/\-\.](\d{2,4})/;

        // Currency: High tolerance for prefixes (R$, RS, R5, $, etc.) and formats (10,00 | 10.00 | 1.000,00)
        // Groups: 1 = The numeric part
        const currencyRegex = /(?:R\$|RS|R5|Rs|\$|R|5\$)?\s*(\d{1,3}(?:[\.\s]\d{3})*(?:,\d{2})|\d{1,3}(?:[,]\d{3})*(?:\.\d{2}))/i;

        // Categories & Payment (Keywords)
        const categories = {
            'alimentacao': ['restaurante', 'lanchonete', 'ifood', 'burger', 'pizza', 'sushi', 'padaria', 'mercado', 'atacadista', 'supermercado', 'food', 'buffet', 'grill', 'sorvete', 'acai'],
            'transporte': ['uber', '99', 'taxi', 'posto', 'combustivel', 'gasolina', 'estacionamento', 'aluguel', 'ipva', 'pedagio'],
            'lazer': ['shopping', 'cinema', 'teatro', 'show', 'netflix', 'spotify', 'amazon', 'shopee', 'loja', 'magazine', 'livraria', 'game'],
            'saude': ['farmacia', 'drogaria', 'medico', 'hospital', 'clinica', 'exame', 'laboratorio', 'dentista', 'vacina'],
            'moradia': ['luz', 'agua', 'energia', 'aluguel', 'condominio', 'internet', 'vivo', 'claro', 'tim', 'oi', 'net', 'eletropaulo', 'sabesp']
        };

        const paymentKeywords = {
            'pix': ['pix'],
            'card': ['cartao', 'credito', 'debito', 'visa', 'master', 'elo', 'amex'],
            'cash': ['dinheiro', 'especie', 'troco'],
            'boleto': ['boleto', 'bank']
        };

        // 3. Line-by-Line Processing
        rawLines.forEach(line => {
            const rawLineUpper = line.trim().toUpperCase();
            if (rawLineUpper.length < 3) return;

            // Create a "Numeric Safe" version of the line for Value/Date extraction
            // Replaces confusable chars ONLY for this check, preserving Description text
            const numericLine = rawLineUpper
                .replace(/O/g, '0')
                .replace(/I/g, '1')
                .replace(/L/g, '1')
                .replace(/S/g, '5')
                .replace(/Z/g, '2');

            // --- DATE DETECTION ---
            if (!dateCandidate) {
                const dateMatch = numericLine.match(dateRegex);
                if (dateMatch) {
                    let d = dateMatch[1].replace(/[Il]/g, '1').replace(/O/g, '0');
                    let m = dateMatch[2].replace(/[Il]/g, '1').replace(/O/g, '0');
                    let y = dateMatch[3].replace(/[Il]/g, '1').replace(/O/g, '0');

                    // Normalize Year (2-digit to 4-digit)
                    if (y.length === 2) y = '20' + y;

                    // Basic Date Validation
                    const day = parseInt(d);
                    const month = parseInt(m);
                    const year = parseInt(y);

                    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
                        dateCandidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        console.log('Date Found:', dateCandidate);
                    }
                }
            }

            // --- CATEGORY & DESCRIPTION DETECTION (Use Raw Line) ---
            if (!category) {
                for (const [catKey, keywords] of Object.entries(categories)) {
                    if (keywords.some(k => rawLineUpper.includes(k.toUpperCase()))) {
                        category = catKey;
                        break;
                    }
                }
            }
            if (!paymentMethod) {
                for (const [methodKey, keywords] of Object.entries(paymentKeywords)) {
                    if (keywords.some(k => rawLineUpper.includes(k.toUpperCase()))) {
                        paymentMethod = methodKey;
                        break;
                    }
                }
            }
            // Simple logic for description: take the first significant line that isn't date/amount/header
            if (!description &&
                !rawLineUpper.includes('CNPJ') &&
                !rawLineUpper.includes('CPF') &&
                !rawLineUpper.includes('EXTRATO') &&
                !rawLineUpper.includes('ITEM') &&
                numericLine.replace(/[^0-9]/g, '').length < numericLine.length * 0.5 // Skip lines that are mostly numbers
            ) {
                description = line.trim().substring(0, 30);
            }


            // --- AMOUNT DETECTION (Use Numeric Line) ---
            const isHighPriority = numericLine.includes('TOTAL') || numericLine.includes('VALOR') || numericLine.includes('PAGAR');

            const amountMatch = numericLine.match(currencyRegex);
            if (amountMatch) {
                let valStr = amountMatch[1];

                // Formatting: 1.200,50 -> 1200.50 | 12.50 -> 12.50
                if (valStr.includes(',') && valStr.includes('.')) {
                    // Complex case: remove dots, keep comma
                    valStr = valStr.replace(/\./g, '').replace(',', '.');
                } else if (valStr.includes(',')) {
                    // Comma decimal
                    valStr = valStr.replace(',', '.');
                }
                // (If only dots, e.g. 10.50, parseFloat handles it directly)

                let val = parseFloat(valStr);

                if (!isNaN(val) && val > 0 && val < 50000) {
                    amountsFound.push({
                        val: val,
                        score: isHighPriority ? 100 : 10, // Boost score for "TOTAL" lines
                        line: numericLine
                    });
                }
            }
        });

        // 4. Decide Best Amount from OCR
        let finalAmount = '';
        let source = 'OCR';

        if (amountsFound.length > 0) {
            // Sort by Score DESC, then Value DESC (assume larger values are likely total)
            amountsFound.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.val - a.val;
            });
            console.log('OCR Potential Amounts:', amountsFound);
            finalAmount = amountsFound[0].val.toFixed(2);
        }

        // 5. QR Code Priority and Extraction
        if (qrData) {
            console.log("Processing QR Data:", qrData);

            let qrValue = null;
            let rawString = qrData;

            // Handle NFC-e URLs (extract 'p' parameter if URL)
            try {
                if (qrData.toLowerCase().startsWith('http')) {
                    const url = new URL(qrData);
                    const p = url.searchParams.get('p');
                    if (p) rawString = p;
                }
            } catch (e) {
                console.warn('QR URL parse warning', e);
            }

            // Pipe-separated format (common in NFC-e: ...|Amount|...)
            if (rawString.includes('|')) {
                const parts = rawString.split('|');
                // Regex for exact decimal format in QR data usually doesn't have separators other than dot
                // But let's look for any likely numeric field in the parts
                for (const part of parts) {
                    if (part.match(/^\d+\.\d{2}$/)) {
                        const val = parseFloat(part);
                        if (val > 0) {
                            qrValue = val;
                            break;
                        }
                    }
                }
            }

            // If found valid value in QR, OVERRIDE everything
            if (qrValue) {
                console.log('Using QR Value over OCR:', qrValue);
                finalAmount = qrValue.toFixed(2);
                source = 'QR Code';
                if (!description) description = "Nota via QR Code";
            }
        }

        console.log(`Final Result (${source}):`, { finalAmount, dateCandidate, description });

        // 6. Return Data
        onScanComplete({
            amount: finalAmount, // String format expected likely
            date: dateCandidate || new Date().toISOString().split('T')[0],
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

            {scanning && !error && (
                <div className="text-center mt-2">
                    <small className="text-muted">{statusText}</small>
                </div>
            )}
        </div>
    );
};

export default ReceiptUpload;
