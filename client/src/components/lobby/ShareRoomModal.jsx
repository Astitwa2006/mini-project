import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { copyToClipboard } from '../../utils/helpers.js';

export default function ShareRoomModal({ isOpen, onClose, code, shareUrl }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 180,
        color: { dark: '#ffffff', light: '#12121f' },
        margin: 2,
      });
    }
  }, [isOpen, shareUrl]);

  async function handleCopy() {
    await copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Players" size="sm">
      <div className="flex flex-col items-center gap-5">
        {/* Room code */}
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-1">Room Code</p>
          <p className="text-5xl font-black font-display tracking-widest gradient-text">{code}</p>
        </div>

        {/* QR code */}
        <canvas ref={canvasRef} className="rounded-xl" />

        {/* Copy link */}
        <div className="w-full space-y-2">
          <p className="text-slate-400 text-xs truncate text-center">{shareUrl}</p>
          <Button onClick={handleCopy} className="w-full" variant={copied ? 'secondary' : 'primary'}>
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
