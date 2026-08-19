/**
 * 邮件发送服务
 * 使用 nodemailer 通过 SMTP 发送邮件（密码重置等）
 */
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    // 如果未配置 SMTP，创建一个不会真正发送的 transporter（日志记录）
    if (!host) {
      console.warn('[mailer] SMTP_HOST 未配置，邮件发送功能不可用');
      return null;
    }
    transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * 发送欢迎注册邮件
 * @param {string} to - 收件人邮箱
 * @param {string} username - 用户名
 */
async function sendWelcomeEmail(to, username) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[mailer] 欢迎邮件（SMTP 未配置，仅日志）:', { to, username });
    return;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || '"研习室" <noreply@example.com>',
    to,
    subject: '研习室 - 注册成功',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #152238;">欢迎加入研习室，${username}！</h2>
        <p style="color: #667085; line-height: 1.6;">您的账号已注册成功，现在可以登录研习室开始学习了。</p>
        <p style="color: #667085; line-height: 1.6;">研习室支持多站点学习，您可以在登录后选择想要学习的站点，开始您的学习之旅。</p>
        <p style="color: #98a1ab; font-size: 12px; margin-top: 24px;">如果这不是您本人的操作，请忽略此邮件。</p>
      </div>
    `,
  });
}

/**
 * 发送密码重置邮件
 * @param {string} to - 收件人邮箱
 * @param {string} resetLink - 重置链接
 */
async function sendResetEmail(to, resetLink) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[mailer] 密码重置链接（SMTP 未配置，仅日志）:', resetLink);
    return;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || '"研习室" <noreply@example.com>',
    to,
    subject: '研习室 - 密码重置',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #152238;">研习室 · 密码重置</h2>
        <p style="color: #667085; line-height: 1.6;">您请求了密码重置，请点击下方按钮设置新密码（链接 1 小时内有效）：</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 28px; background: #f26b4f; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 16px 0;">
          重置密码
        </a>
        <p style="color: #667085; line-height: 1.6;">或复制以下链接到浏览器：</p>
        <p style="color: #2b8c88; word-break: break-all; font-size: 13px;">${resetLink}</p>
        <p style="color: #98a1ab; font-size: 12px; margin-top: 24px;">如果这不是您本人的操作，请忽略此邮件。</p>
      </div>
    `,
  });
}

module.exports = { sendWelcomeEmail, sendResetEmail };