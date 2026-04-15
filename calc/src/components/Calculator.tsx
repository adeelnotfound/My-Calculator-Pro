import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
    Delete,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    Settings2
} from 'lucide-react';

const math = create(all);

// We override the default math functions to work with degrees and 
// provide more intuitive log/ln behavior for a standard calculator.
// We use Math object directly for trig to ensure absolute degree control.
math.import({
    sin: (x: number) => {
        const rad = (x * Math.PI) / 180;
        const res = Math.sin(rad);
        return Math.abs(res) < 1e-12 ? 0 : res;
    },
    cos: (x: number) => {
        const rad = (x * Math.PI) / 180;

        // Normalize angle to avoid large-number precision issues
        const normalized = rad % (2 * Math.PI);

        const res = Math.cos(normalized);

        // Snap very small values to 0
        if (Math.abs(res) < 1e-10) return 0;

        // Snap values very close to 1 or -1
        if (Math.abs(res - 1) < 1e-10) return 1;
        if (Math.abs(res + 1) < 1e-10) return -1;

        return res;
    },
    tan: (x: number) => {
        const rad = (x * Math.PI) / 180;
        const res = Math.tan(rad);
        return Math.abs(res) < 1e-12 ? 0 : res;
    },
    ln: (x: number) => Math.log(x),
    log: (x: number) => Math.log10(x)
}, { override: true });

// This is the main calculator component. 
// It handles all the math logic and the UI layout.
export default function Calculator() {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // This bit makes sure the display always shows the latest numbers 
    // by scrolling to the right as you type longer expressions.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }

        // Trigger calculation whenever the expression changes
        if (expression) {
            calculate(expression);
        } else {
            setResult(null);
        }
    }, [expression]);

    // This function takes the string we've typed and turns it into a number.
    // We use mathjs to handle the heavy lifting like trig and square roots.
    const calculate = (expr: string) => {
        // We'll work on a copy so we don't mess up the displayed expression
        let sanitizedExpr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, 'pi')
            .replace(/e/g, 'e');

        // Auto-close parentheses for the evaluation step so the user sees a preview
        const openBrackets = (sanitizedExpr.match(/\(/g) || []).length;
        const closeBrackets = (sanitizedExpr.match(/\)/g) || []).length;
        let evalExpr = sanitizedExpr;
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
            evalExpr += ')';
        }

        try {
            // Since we've overridden the functions globally, we can just evaluate
            // the expression directly. This ensures operators like 'mod' work perfectly.
            const evalResult = math.evaluate(evalExpr);

            if (evalResult === undefined || evalResult === null) {
                setResult(null);
                return;
            }

            // Format the result to avoid long floating point numbers
            let formattedResult: string;
            if (typeof evalResult === 'number') {
                // Fix precision issues and handle scientific notation for very large/small numbers
                if (Math.abs(evalResult) < 1e-10 && evalResult !== 0) {
                    formattedResult = evalResult.toExponential(4);
                } else if (Math.abs(evalResult) > 1e12) {
                    formattedResult = evalResult.toExponential(4);
                } else {
                    // Round to 10 decimal places and remove trailing zeros
                    formattedResult = Number(evalResult.toFixed(10)).toString();
                }
            } else if (evalResult && typeof evalResult === 'object' && 'value' in evalResult) {
                // Handle cases where mathjs might return a BigNumber or Unit
                formattedResult = String(evalResult.value);
            } else {
                formattedResult = String(evalResult);
            }

            setResult(formattedResult);
        } catch (error) {
            // If the expression is still invalid (like "5 + *"), just hide the result
            setResult(null);
        }
    };

    // Just a simple helper to append whatever button you pressed to the current string.
    const handleInput = (value: string) => {
        setExpression((prev) => prev + value);
    };

    // Wipes everything so you can start over.
    const handleClear = () => {
        setExpression('');
        setResult(null);
    };

    // Backspace functionality to fix typos.
    const handleDelete = () => {
        setExpression((prev) => prev.slice(0, -1));
    };

    // When you hit '=', we save the result and clear the preview.
    const handleEqual = () => {
        if (result && result !== 'Error') {
            setHistory((prev) => [expression + ' = ' + result, ...prev].slice(0, 10));
            setExpression(result);
            setResult(null);
        }
    };

    const buttons = [
        { label: 'AC', action: handleClear, className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold' },
        { label: '(', action: () => handleInput('('), className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold' },
        { label: ')', action: () => handleInput(')'), className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold' },
        { label: '÷', action: () => handleInput('÷'), className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold text-2xl' },

        { label: '7', action: () => handleInput('7'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '8', action: () => handleInput('8'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '9', action: () => handleInput('9'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '×', action: () => handleInput('×'), className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold text-2xl' },

        { label: '4', action: () => handleInput('4'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '5', action: () => handleInput('5'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '6', action: () => handleInput('6'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '-', action: () => handleInput('-'), className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold text-2xl' },

        { label: '1', action: () => handleInput('1'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '2', action: () => handleInput('2'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '3', action: () => handleInput('3'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '+', action: () => handleInput('+'), className: 'bg-[#E5E5EA] text-[#1A1A1B] font-semibold text-2xl' },

        { label: '.', action: () => handleInput('.'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: '0', action: () => handleInput('0'), className: 'bg-[#F2F2F7] text-[#1A1A1B]' },
        { label: 'DEL', action: handleDelete, className: 'bg-[#F2F2F7] text-[#1A1A1B] flex items-center justify-center' },
        { label: '=', action: handleEqual, className: 'bg-[#007AFF] text-white rounded-2xl hover:bg-[#0062CC]' },
    ];

    const advancedButtons = [
        { label: 'sin', action: () => handleInput('sin(') },
        { label: 'cos', action: () => handleInput('cos(') },
        { label: 'tan', action: () => handleInput('tan(') },
        { label: 'log', action: () => handleInput('log(') },
        { label: 'ln', action: () => handleInput('ln(') },
        { label: '√', action: () => handleInput('sqrt(') },
        { label: 'x²', action: () => handleInput('^2') },
        { label: 'xⁿ', action: () => handleInput('^') },
        { label: 'π', action: () => handleInput('π') },
        { label: 'e', action: () => handleInput('e') },
        {
            label: '+/-', action: () => {
                setExpression(prev => {
                    if (!prev) return '-';
                    // If it's already wrapped in a minus, unwrap it
                    if (prev.startsWith('-(') && prev.endsWith(')')) return prev.slice(2, -1);
                    // If it's a simple negative number, make it positive
                    if (prev.startsWith('-') && !prev.includes(' ')) return prev.slice(1);
                    // Otherwise wrap the whole thing
                    return `-(${prev})`;
                });
            }
        },
        { label: 'mod', action: () => handleInput(' mod ') },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans text-[#1A1A1B]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[380px] bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative"
                style={{ height: '680px' }}
            >
                {/* The screen where numbers show up */}
                <div className="flex-1 px-8 flex flex-col justify-end items-end gap-1 pb-8 overflow-hidden pt-12">
                    <div
                        ref={scrollRef}
                        className="w-full text-right text-[#8E8E93] text-xl font-normal whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth tracking-[-0.5px]"
                    >
                        {expression || '0'}
                    </div>
                    <AnimatePresence mode="wait">
                        {result && (
                            <motion.div
                                key={result}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-[64px] font-light tracking-[-2px] text-[#1A1A1B] break-all text-right leading-tight"
                            >
                                {result}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* All the buttons go here */}
                <div className="px-8 pb-10">
                    <div className="flex justify-start mb-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-[#007AFF] text-xs font-bold flex items-center gap-1"
                        >
                            {showAdvanced ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                            {showAdvanced ? 'Basic' : 'Advanced'}
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {/* Extra math functions like sin/cos that slide in */}
                        <AnimatePresence mode="popLayout">
                            {showAdvanced && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="col-span-4 grid grid-cols-4 gap-3 overflow-hidden border-t border-[#F2F2F7] pt-5 mb-3"
                                >
                                    {advancedButtons.map((btn) => (
                                        <CalcButton
                                            key={btn.label}
                                            label={btn.label}
                                            onClick={btn.action}
                                            className="bg-transparent text-[#007AFF] text-[15px] font-semibold h-12 shadow-none hover:bg-[#F2F2F7]"
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* The standard 0-9 and basic operators */}
                        {buttons.map((btn) => (
                            <CalcButton
                                key={btn.label}
                                label={btn.label}
                                onClick={btn.action}
                                className={btn.className}
                            />
                        ))}
                    </div>
                </div>

            </motion.div>
        </div>
    );
}

interface CalcButtonProps {
    label: string | React.ReactNode;
    onClick: () => void;
    className?: string;
    key?: string | number;
}

function CalcButton({ label, onClick, className }: CalcButtonProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            className={cn(
                "h-16 rounded-[20px] flex items-center justify-center text-[19px] font-medium transition-colors",
                "bg-[#F2F2F7] text-[#1A1A1B] shadow-none",
                className
            )}
        >
            {label === 'DEL' ? <Delete size={20} /> : label}
        </motion.button>
    );
}
