import day from '#/utils/day';
import { ExceptionCode } from '#/constants/exception';
import { EMAIL } from '#/constants/regexp';
import db from '@/db';
import generateRandomInteger from '#/utils/generate_random_integer';
import { REMARK_MAX_LENGTH } from '#/constants/user';
import { sendEmail } from '@/platform/email';
import config from '@/config';
import { Property, getUserByEmail } from '@/db/user';
import { BRAND_NAME } from '#/constants';
import { Context } from '../constants';

const generateEmailHtml = () => `Hi,
<br>
<br>
已成功为您创建账号, 现在可以使用当前邮箱登录到「<a href="${
  config.publicAddress
}">知了</a>」.
<br>
如果使用中有任何问题或者建议, 可以通过 <a href="https://github.com/mebtte/cicada">Issue</a> 进行反馈.
<br>
<br>
知了
<br>
${day(new Date()).format('YYYY-MM-DD HH:mm')}`;

export default async (ctx: Context) => {
  const { email, remark = '' } = ctx.request.body as {
    email?: unknown;
    remark?: unknown;
  };

  if (
    typeof email !== 'string' ||
    !EMAIL.test(email) ||
    typeof remark !== 'string' ||
    remark.length > REMARK_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByEmail(email, [Property.ID]);
  if (user) {
    return ctx.except(ExceptionCode.EMAIL_EXISTED);
  }

  await sendEmail({
    to: email,
    title: `欢迎使用${BRAND_NAME}`,
    html: generateEmailHtml(),
  });

  const id = generateRandomInteger(1_0000_0000, 10_0000_0000).toString();
  await db.run(
    `
      INSERT INTO user ( id, email, nickname, joinTimestamp, remark )
      VALUES ( ?, ?, ?, ?, ? )
    `,
    [id, email, id, Date.now(), remark],
  );

  return ctx.success();
};