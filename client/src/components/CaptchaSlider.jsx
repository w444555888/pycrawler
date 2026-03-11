import React, { useEffect, useState } from "react";
import SliderCaptcha from "rc-slider-captcha";
import { request } from "../utils/apiService";
import { toast } from "react-toastify";

const CaptchaSlider = ({ onPass, onFail }) => {
  /**
   * captchaToken: 來自後端，用來驗證這一次滑塊行為
   * bgImgUrl: 背景圖 base64 資料（有挖缺口）
   * puzzleImgUrl: 拼圖塊 base64 資料
   * puzzleY: 拼圖塊與缺口的 Y 座標（通常是垂直置中）
   * ready: 用來控制 SliderCaptcha 是否準備好渲染
   */
  const [captchaToken, setCaptchaToken] = useState("");
  const [bgImgUrl, setBgImgUrl] = useState("");
  const [puzzleImgUrl, setPuzzleImgUrl] = useState("");
  const [puzzleTop, setPuzzleTop] = useState(0);
  const [ready, setReady] = useState(false);

  const BG_WIDTH = 400;
  const BG_HEIGHT = 200;
  const PUZZLE_SIZE = 50;

  useEffect(() => {
    const initCaptcha = async () => {
      const res = await request("GET", "/captcha/initCaptcha");
      if (res.success) {
        const imgs = ["/captchaSlider1.jpg", "/captchaSlider2.jpg"];
        const randomBg = imgs[Math.floor(Math.random() * imgs.length)];

        setCaptchaToken(res.data.token);
        const { puzzleBase64, bgWithHole, puzzleY } = await createPuzzleFromBg(
          randomBg,
          res.data.targetX
        );

        setPuzzleTop(puzzleY);
        setBgImgUrl(bgWithHole);
        setPuzzleImgUrl(puzzleBase64);
        setReady(true);
      } else {
        toast.error(res.message || "驗證初始化失敗");
      }
    };

    initCaptcha();
  }, []);

  const handleVerify = async ({ x }) => {
    const res = await request("POST", "/captcha/verifyCaptcha", {
      token: captchaToken,
      userX: x,
    });

    if (res.success) {
      toast.success("驗證成功！");
      onPass?.();
      return Promise.resolve();
    } else {
      toast.error(res.message || "驗證失敗，請重試");
      onFail?.();
      return Promise.reject();
    }
  };

  const createPuzzleFromBg = (bgUrl, targetX) => {
    return new Promise((resolve) => {
      
      // 設定拼圖塊的 Y 座標（垂直置中 上到下繪製）
      const PUZZLE_Y = (BG_HEIGHT - PUZZLE_SIZE) / 2;

      const img = new Image();
      img.crossOrigin = "Anonymous"; //跨域
      img.src = bgUrl;

      img.onload = () => {
        // 計算圖片與畫布的寬高比例
        const imgRatio = img.width / img.height;
        const canvasRatio = BG_WIDTH / BG_HEIGHT;

        // 判斷圖片該以寬或高為基準等比例縮放
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        if (imgRatio > canvasRatio) {
          // 圖片太寬 → 固定高度，依比例算出寬度並裁左右
          drawHeight = BG_HEIGHT;
          drawWidth = img.width * (BG_HEIGHT / img.height);
          offsetX = (drawWidth - BG_WIDTH) / 2;  // 多出來的左右裁掉一半
        } else {
          drawWidth = BG_WIDTH;
          // 圖片太高 → 固定寬度，依比例算出高度並裁上下
          drawHeight = img.height * (BG_WIDTH / img.width);
          offsetY = (drawHeight - BG_HEIGHT) / 2; // 多出來的上下裁掉一半
        }

        // 建立處理完比例的背景圖畫布
        const renderedCanvas = document.createElement("canvas");
        renderedCanvas.width = BG_WIDTH;
        renderedCanvas.height = BG_HEIGHT;
        const renderedCtx = renderedCanvas.getContext("2d");
        // 將圖片以正確比例裁切後畫進畫布
        renderedCtx.drawImage(img, -offsetX, -offsetY, drawWidth, drawHeight);

        // 建立拼圖塊畫布（50x50）
        const puzzleCanvas = document.createElement("canvas");
        puzzleCanvas.width = PUZZLE_SIZE;
        puzzleCanvas.height = PUZZLE_SIZE;
        const puzzleCtx = puzzleCanvas.getContext("2d");
        // 從處理好的背景圖中裁出一塊拼圖圖案
        puzzleCtx.drawImage(
          renderedCanvas, // 來源畫布
          targetX, PUZZLE_Y,  // 從 (x, y) = (目標x, 垂直置中) 開始裁
          PUZZLE_SIZE, PUZZLE_SIZE,   // 裁切大小
          0, 0,  // 貼到拼圖畫布的起點
          PUZZLE_SIZE, PUZZLE_SIZE // 保持大小
        );
        // 加上白色邊框方便使用者看見拼圖形狀
        puzzleCtx.strokeStyle = "white";
        puzzleCtx.lineWidth = 2;
        puzzleCtx.strokeRect(0, 0, PUZZLE_SIZE, PUZZLE_SIZE);
        const puzzleBase64 = puzzleCanvas.toDataURL("image/png");


        // 建立背景圖畫布並複製原背景圖（準備挖洞）
        const bgCanvas = document.createElement("canvas");
        bgCanvas.width = BG_WIDTH;
        bgCanvas.height = BG_HEIGHT;
        const bgCtx = bgCanvas.getContext("2d");
        bgCtx.drawImage(renderedCanvas, 0, 0);// 直接畫整張背景圖
        bgCtx.clearRect(targetX, PUZZLE_Y, PUZZLE_SIZE, PUZZLE_SIZE);// 清除掉拼圖所在位置 → 挖一個透明洞
        const bgWithHole = bgCanvas.toDataURL("image/png");

        resolve({ puzzleBase64, bgWithHole, puzzleY: PUZZLE_Y });
      };
    });
  };

  return (
    <div style={{ width: BG_WIDTH, margin: "0 auto" }}>
      {ready && (
        <SliderCaptcha
          request={async () => ({
            bgUrl: bgImgUrl,
            puzzleUrl: puzzleImgUrl,
          })}
          onVerify={handleVerify}
          bgSize={{ width: BG_WIDTH, height: BG_HEIGHT }}
          puzzleSize={{
            width: PUZZLE_SIZE,
            height: PUZZLE_SIZE,
            top: puzzleTop,
          }}
          tipText={{
            default: "請拖動滑塊完成驗證",
            success: "驗證成功",
            error: "驗證失敗",
          }}
        />
      )}
    </div>
  );
};

export default CaptchaSlider;
