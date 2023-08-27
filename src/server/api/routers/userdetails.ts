import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";
import { getUserDetails, setUserDetails, setUserImage } from "~/server/Services/UserDetails";

export const authRouter = createTRPCRouter({
  profile: protectedProcedure
    .query(async(opts) => {
      const session = opts.ctx.session;
      const userId = session.user.id;
      return await getUserDetails(userId);
    }),
  
  setProfile: protectedProcedure
    .input(z.object(
      { name: z.string(), contact: z.string(), email: z.string().email()}
    ))
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      const userId = session.user.id;
      await setUserDetails(userId, opts.input.name, opts.input.contact, opts.input.email);
    }),

  setImage: protectedProcedure
    .input(z.object(
      { newImage: z.string()}
    ))
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      const userId = session.user.id;
      await setUserImage(userId, opts.input.newImage);
    })
});
