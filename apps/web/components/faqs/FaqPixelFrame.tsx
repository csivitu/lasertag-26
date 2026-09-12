export function FaqPixelFrame() {
    return (
        <div className="faq-pixel-frame" aria-hidden="true">
            {/* 4 Straight Edges */}
            <span className="faq-edge-top" />
            <span className="faq-edge-bottom" />
            <span className="faq-edge-left" />
            <span className="faq-edge-right" />

            {/* Top-Left Stepped Corner */}
            <span className="faq-corner-tl-h" />
            <span className="faq-corner-tl-v" />

            {/* Top-Right Stepped Corner */}
            <span className="faq-corner-tr-h" />
            <span className="faq-corner-tr-v" />

            {/* Bottom-Right Stepped Corner */}
            <span className="faq-corner-br-h" />
            <span className="faq-corner-br-v" />

            {/* Bottom-Left Stepped Corner */}
            <span className="faq-corner-bl-h" />
            <span className="faq-corner-bl-v" />
        </div>
    );
}
