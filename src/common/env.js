const { z } = require('zod/v4')

exports.env = z
  .object({
    PORT: z.coerce.number().default(3000),

    DATABASE_HOST: z.string().nonempty(),
    DATABASE_PORT: z.coerce.number().default(3306),
    DATABASE_USERNAME: z.string().nonempty(),
    DATABASE_PASSWORD: z.string().nonempty()
  })
  .parse(process.env)