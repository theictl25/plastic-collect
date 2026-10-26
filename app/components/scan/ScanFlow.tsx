import { useState } from 'react';
import {
  ChevronLeft,
  Check,
  Recycle,
  QrCode,
  Camera,
  CheckCircle2,
  Star,
  History,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

export function ScanFlow() {
  const { t, scanBinId, handleScanComplete, cancelScan } = useApp();
  const [step, setStep] = useState<number>(1);
  const [binNumber, setBinNumber] = useState<string>(scanBinId || 'BIN-003');
  const [manualInput, setManualInput] = useState<string>('');
  const [isPhotoCaptured, setIsPhotoCaptured] = useState<boolean>(false);

  const stepLabels = ['Scan', 'Photo', 'Verify', 'Confirm'];

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      setBinNumber(manualInput.trim().toUpperCase());
    }
    setStep(2);
  };

  const handleSimulateScan = () => {
    setStep(2);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Back button */}
      <button
        onClick={cancelScan}
        className="inline-flex items-center gap-1.5 text-gp font-bold text-sm hover:underline cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t.scanQrTitle}</span>
      </button>

      {/* Stepper Progress */}
      <div className="flex items-center justify-center gap-2 my-5">
        {stepLabels.map((label, idx) => {
          const stepNumber = idx + 1;
          const isDone = step > stepNumber;
          const isCurrent = step === stepNumber;

          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isDone
                      ? 'bg-gp text-white'
                      : isCurrent
                      ? 'bg-gp text-white ring-4 ring-gp-l'
                      : 'bg-gray-100 text-gp-gray'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : stepNumber}
                </span>
                <span className="text-[11px] font-medium text-gp-gray">{label}</span>
              </div>

              {idx < stepLabels.length - 1 && (
                <span
                  className={`w-8 sm:w-14 h-0.5 mb-4 transition-colors ${
                    step > stepNumber ? 'bg-gp' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content Card */}
      <Card className="p-5 space-y-4">
        {/* Step 1: Scan QR or Enter ID */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative mx-auto w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-100 flex items-center justify-center overflow-hidden border border-emerald-100 shadow-inner">
              <div className="w-36 h-44 rounded-t-xl rounded-b-3xl bg-gp text-white flex flex-col items-center justify-center shadow-xl">
                <div className="bg-white text-gp text-xs font-bold px-2 py-1 rounded mb-2 shadow-xs">
                  {binNumber}
                </div>
                <Recycle className="w-14 h-14" />
              </div>

              {/* Viewfinder corner brackets */}
              <span className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-gp-m rounded-tl-lg" />
              <span className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-gp-m rounded-tr-lg" />
              <span className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-gp-m rounded-bl-lg" />
              <span className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-gp-m rounded-br-lg" />
            </div>

            <p className="text-center font-semibold text-gray-800 text-sm">
              {t.scanInstruction}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={t.enterManual}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gp-m"
              />
              <Button
                variant="secondary"
                onClick={handleManualSubmit}
                className="px-5 font-bold"
              >
                {t.go}
              </Button>
            </div>

            <Button
              onClick={handleSimulateScan}
              className="w-full py-3.5 text-base shadow"
            >
              <QrCode className="w-5 h-5" />
              <span>{t.simulateScan}</span>
            </Button>
          </div>
        )}

        {/* Step 2: Photo Verification */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="relative rounded-2xl h-64 bg-gradient-to-br from-emerald-200 to-sky-200 flex items-center justify-center text-7xl select-none shadow-inner border border-emerald-100">
              {isPhotoCaptured ? '🧴' : '📷'}
              {isPhotoCaptured && (
                <span className="absolute bottom-3 left-3 right-3 bg-white/95 rounded-xl px-3.5 py-2.5 text-sm text-gp font-bold flex items-center gap-2 shadow-sm border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-gp" />
                  <span>{t.photoCaptured}</span>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {!isPhotoCaptured ? (
                <Button
                  onClick={() => setIsPhotoCaptured(true)}
                  className="flex-1 py-3 text-sm shadow"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.takePhoto}</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsPhotoCaptured(false)}
                    className="px-4 py-3 text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t.retake}</span>
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 text-sm shadow"
                  >
                    {t.continueBtn}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Verify Details */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between py-3">
                <span className="text-gp-gray font-medium">{t.binId}</span>
                <span className="font-bold text-gray-900">{binNumber}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gp-gray font-medium">{t.wasteType}</span>
                <span className="font-bold text-gray-900">{t.plastic}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gp-gray font-medium">{t.dateTime}</span>
                <span className="font-bold text-gray-900">
                  {new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gp-gray font-medium">{t.photoAttached}</span>
                <span className="font-bold text-gp flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.attached}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setStep(4)}
              className="w-full py-4 text-base shadow-md"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t.confirmDisposal}</span>
            </Button>
          </div>
        )}

        {/* Step 4: Success & Points Awarded */}
        {step === 4 && (
          <div className="text-center py-4 relative">
            <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gp-m to-gp text-white flex items-center justify-center shadow-xl mb-4">
              <Star className="w-14 h-14 fill-white" />
            </div>

            <h3 className="text-2xl font-bold text-gp tracking-tight">
              {t.pointsEarned}
            </h3>

            <div className="mt-3 inline-block bg-gp text-white text-3xl font-extrabold px-8 py-2 rounded-full shadow-md">
              +10 {t.pts}
            </div>

            <div className="mt-5 text-left divide-y divide-gray-100 text-sm bg-gp-bg rounded-xl px-4 py-1 border border-gray-100">
              <div className="flex justify-between py-2.5">
                <span className="text-gp-gray">{t.binId}</span>
                <span className="font-semibold text-gray-900">{binNumber}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gp-gray">{t.wasteType}</span>
                <span className="font-semibold text-gray-900">{t.plastic}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gp-gray">{t.dateTime}</span>
                <span className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <Button
              onClick={() => void handleScanComplete(binNumber)}
              className="w-full mt-5 py-3.5 text-base shadow"
            >
              <History className="w-4 h-4" />
              <span>{t.viewHistory}</span>
            </Button>

            <p className="text-xs text-gp-gray mt-3">{t.thankYou}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
