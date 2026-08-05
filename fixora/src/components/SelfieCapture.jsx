import React, { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Captures a live selfie via the device camera (front-facing where available)
 * instead of accepting an uploaded file — this is what stops someone from
 * submitting an old photo, a photo of a photo, or someone else's picture,
 * the same way Rapido/Blinkit driver-partner KYC works.
 *
 * Face coverage check: where the browser supports the native Shape
 * Detection API (`window.FaceDetector` — currently Chrome on Android and
 * some desktop Chrome builds behind a flag), this detects a face in the
 * live feed in real time and only enables the capture button once exactly
 * one face is visible and large enough in frame — catching an empty frame,
 * a face turned away, or the camera pointed somewhere else. It cannot
 * reliably detect "is this face covered by a mask/scarf" — that needs a
 * proper ML face-landmark model, which is a heavier addition than the
 * browser's built-in detector. Where FaceDetector isn't supported, capture
 * still works, just without the automatic check — the on-screen guide oval
 * is shown either way so the person can self-align.
 *
 * Falls back to the OS camera app (not the photo gallery) on browsers/devices
 * where getUserMedia isn't available, via capture="user" on a file input.
 */
export default function SelfieCapture({ value, onChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [faceOk, setFaceOk] = useState(null); // null = detector unsupported, true/false = live result

  const faceDetectionSupported = typeof window !== "undefined" && "FaceDetector" in window;

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      if (faceDetectionSupported) {
        detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        detectIntervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const faces = await detectorRef.current.detect(videoRef.current);
            if (faces.length !== 1) {
              setFaceOk(false);
              return;
            }
            const box = faces[0].boundingBox;
            const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
            const faceArea = box.width * box.height;
            // Face should fill a reasonable chunk of the frame — too small
            // usually means too far away or angled/partially out of shot
            setFaceOk(faceArea / frameArea > 0.06);
          } catch {
            setFaceOk(null);
          }
        }, 500);
      }
    } catch (err) {
      setError("Couldn't access your camera. Check your browser's camera permission, or use a phone to continue.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearInterval(detectIntervalRef.current);
    setCameraOn(false);
    setFaceOk(null);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Mirror the image so it looks natural (like a mirror), matching the preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      onChange(file);
      stopCamera();
    }, "image/jpeg", 0.9);
  }

  function retake() {
    onChange(null);
    startCamera();
  }

  const previewUrl = value ? URL.createObjectURL(value) : null;
  const canCapture = faceDetectionSupported ? faceOk === true : true;

  return (
    <div>
      <p className="text-sm font-medium text-[#14213D] mb-2">Take a selfie</p>

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[#D7E3F4]">
          <img src={previewUrl} alt="Your selfie" className="w-14 h-14 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#14213D] flex items-center gap-1.5">
              <CheckCircle2 size={14} color="#1FA97F" /> Selfie captured
            </p>
            <button type="button" onClick={retake} className="text-xs text-[#0F7C6C] font-medium flex items-center gap-1 mt-0.5">
              <RotateCcw size={11} /> Retake
            </button>
          </div>
        </div>
      ) : cameraOn ? (
        <div className="rounded-lg overflow-hidden border border-[#D7E3F4]">
          <div className="relative bg-black">
            <video ref={videoRef} className="w-full aspect-video object-cover" style={{ transform: "scaleX(-1)" }} muted playsInline />
            {/* Guide oval — always shown so the person can self-align even without ML detection */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[42%] aspect-[3/4] rounded-[50%] border-2"
                style={{ borderColor: faceDetectionSupported ? (faceOk ? "#1FA97F" : "#FFB020") : "rgba(255,255,255,0.7)" }}
              />
            </div>
            {faceDetectionSupported && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] px-2.5 py-1 rounded-full bg-black/60 text-white">
                {faceOk ? "Face detected — you're good to capture" : "Fit your whole face in the oval, nothing covering it"}
              </div>
            )}
          </div>
          <div className="p-3 bg-[#F0F7FF]">
            <button
              type="button"
              onClick={capture}
              disabled={!canCapture}
              className="w-full bg-[#0F7C6C] text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Camera size={16} /> Capture
            </button>
            {!faceDetectionSupported && (
              <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
                Your browser doesn't support live face detection — align yourself with the oval and capture manually.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={startCamera}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#D7E3F4] hover:bg-[#F0F7FF]"
          >
            <div className="w-9 h-9 rounded-lg bg-[#E7F3F1] flex items-center justify-center shrink-0">
              <Camera size={16} color="#0F7C6C" />
            </div>
            <span className="text-sm text-[#14213D]">Open camera to take a live selfie</span>
          </button>

          {error && (
            <div className="mt-2">
              <p className="text-xs text-[#D64541] flex items-center gap-1.5 mb-2">
                <AlertTriangle size={12} /> {error}
              </p>
              {/* Fallback for browsers without camera API access — still forces
                  the OS camera app, not the photo gallery, on most mobile devices */}
              <label className="text-xs text-[#0F7C6C] font-medium cursor-pointer">
                Try your device's camera app instead
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
                />
              </label>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
