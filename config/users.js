/**
 * 账号表（手动维护）
 *
 * 每个账号：
 *   - username: 登录账号
 *   - password: 不再写在这里 —— 明文密码一律从环境变量注入，
 *     config/index.js 会读取 USER_PASSWORD_<用户名全大写>（如 USER_PASSWORD_ADMIN）。
 *     参考 .env.example，把密码填进本地的 .env（已被 gitignore）。
 *   - displayName: 显示名称（顶栏 / 欢迎语）
 *   - allowedSites: 该账号可访问的学习站点 key（对应 config/sites.js 中的 key）
 *
 * 新增/修改账号或调整其可访问站点，直接编辑本文件即可。
 */
module.exports = {
  users: [
    {
      username: 'admin',
      displayName: '管理员',
      role: '管理员',
      allowedSites: ['c', 'grammar'],
    },
  ],
};