import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

const ReceiptUpload = ({ onScanComplete }) => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        setProgress(0);

        try {
            const result = await Tesseract.recognize(
                file,
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

        // Regex patterns
        // Matches R$ 10,00 or 10,00 or 10.00
        const amountRegex = /(?:R\$|TOTAL|VALOR|PAGAR)\s*[:.]?\s*(\d+[.,]\d{2})/i;
        // Matches DD/MM/YYYY or YYYY-MM-DD
        const dateRegex = /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/;

        // Try to find total amount (usually near the bottom, but we scan all)
        // We look for the largest number that looks like a price, or lines with "Total"
        const amountsFound = [];

        lines.forEach(line => {
            // Date
            if (!date) {
                const dateMatch = line.match(dateRegex);
                if (dateMatch) {
                    // Convert DD/MM/YYYY to YYYY-MM-DD for input
                    const parts = dateMatch[1].split('/');
                    if (parts.length === 3) {
                        date = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else {
                        date = dateMatch[1];
                    }
                }
            }

            // Amount candidates
            const amountMatch = line.match(/(\d+[.,]\d{2})/);
            if (amountMatch) {
                // Normalize 1.000,00 -> 1000.00
                let valStr = amountMatch[1].replace('.', '').replace(',', '.');
                let val = parseFloat(valStr);
                if (!isNaN(val)) {
                    amountsFound.push({ val, line: line.toLowerCase() });
                }
            }
        });

        // Heuristic for amount: prefer lines with "total" or "pagar", otherwise max value
        const totalLine = amountsFound.find(a => a.line.includes('total') || a.line.includes('pagar') || a.line.includes('valor'));
        if (totalLine) {
            amount = totalLine.val;
        } else if (amountsFound.length > 0) {
            // Fallback: Max value found (risky but often correct for receipts)
            amount = Math.max(...amountsFound.map(a => a.val));
        }

        // Description: First non-empty line that isn't a date or purely numeric
        for (let line of lines) {
            const cleanLine = line.trim();
            if (cleanLine && cleanLine.length > 3 && !cleanLine.match(dateRegex) && isNaN(parseFloat(cleanLine))) {
                description = cleanLine.substring(0, 30); // Limit length
                break;
            }
        }

        onScanComplete({
            amount: amount ? amount.toString() : '',
            date: date || '',
            description: description || 'Despesa detectada'
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
