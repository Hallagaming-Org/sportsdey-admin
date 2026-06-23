import { X } from "lucide-react";
import SuccessIndicator from "#/assets/SuccessIndicator.png";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  text: string;
  buttonText?: string;
}

export function SuccessModal({
  open,
  onClose,
  title = "Success!",
  text,
  buttonText = "Done",
}: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[400px] bg-white rounded-[24px] p-8 flex flex-col items-center text-center shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full border border-gray-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <img src={SuccessIndicator} alt="Success" className="w-[84px] h-[84px] object-contain mb-4" />

        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-8 max-w-[280px]">
          {text}
        </p>

        <button
          onClick={onClose}
          className="w-[180px] bg-[#1BAA04] text-white font-bold py-3.5 rounded-[40px] transition-colors cursor-pointer"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
