
import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface Props {
    children: React.ReactNode;
    width?: 'fit-content' | '100%';
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    className?: string;
    allowOverflow?: boolean;
    fullHeight?: boolean;
    style?: React.CSSProperties;
}

export const Reveal = ({
    children,
    width = 'fit-content',
    delay = 0.25,
    direction = 'up',
    className = '',
    allowOverflow = false,
    fullHeight = false,
    style
}: Props) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const mainControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible");
        }
    }, [isInView, mainControls]);

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 75 : direction === 'down' ? -75 : 0,
            x: direction === 'left' ? 75 : direction === 'right' ? -75 : 0,
        },
        visible: { opacity: 1, y: 0, x: 0 },
    };

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width,
                overflow: allowOverflow ? "visible" : "hidden",
                height: fullHeight ? "100%" : "auto",
                ...style
            }}
            className={className}
        >
            <motion.div
                variants={variants}
                initial="hidden"
                animate={mainControls}
                transition={{ duration: 0.5, delay: delay }}
                style={{ height: fullHeight ? "100%" : "auto" }}
            >
                {children}
            </motion.div>
        </div>
    );
};
