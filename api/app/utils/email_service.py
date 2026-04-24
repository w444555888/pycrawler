import smtplib  # Python 內建的 SMTP（發送郵件）模組
from email.mime.text import MIMEText  # 處理純文字格式郵件內容
from email.mime.multipart import MIMEMultipart  # 處理多段郵件（主旨、內文等）
from app.core.config import settings
import os


# env
EMAIL_ADDRESS = settings.EMAIL
EMAIL_PASSWORD = settings.EMAIL_PASSWORD
CLIENT_URL = settings.CLIENT_URL


async def send_reset_email(to_email: str, token: str):
    subject = "重置密碼請求"
    reset_link = f"{CLIENT_URL}/reset-password/{token}"
    body = f"""請點擊以下鏈接重置你的密碼：
    {reset_link}
    如果你沒有請求此操作，請忽略此郵件。
    """

    # 建立一個多段郵件物件
    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        # 建立與 Gmail SMTP 伺服器的連線，使用 TLS 加密（587 為 TLS port）
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise Exception(f"郵件發送失敗: {str(e)}")


async def send_email(to: str, subject: str, html_content: str = None, text_content: str = None):
    """發送郵件 - 支持HTML和純文字格式"""
    # 建立一個多段郵件物件
    msg = MIMEMultipart("alternative")
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to
    msg["Subject"] = subject

    # 添加文字內容
    if text_content:
        text_part = MIMEText(text_content, "plain", "utf-8")
        msg.attach(text_part)
    
    # 添加HTML內容
    if html_content:
        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)

    try:
        # 建立與 Gmail SMTP 伺服器的連線
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise Exception(f"郵件發送失敗: {str(e)}")
