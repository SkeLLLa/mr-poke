import type { PrismaClient } from '@prisma/client';
import { ILoggableDeps, Loggable } from '../../common/Loggable';

export interface IUser {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  timezone: string;
  timezoneOffset: number;
  locale: string;
}

export interface ISlackUser {
  id: string;
}
export interface IGitlabUser {
  id: number;
}
export interface IUserEmail {
  email: string;
  domain: string;
}

export interface IFullUser extends IUser {
  slackUser: ISlackUser | null;
  gitlabUser: IGitlabUser | null;
  emails: IUserEmail[];
}
export class UsersProvider extends Loggable {
  constructor(
    private readonly deps: {
      prisma: PrismaClient;
    } & ILoggableDeps,
  ) {
    super(UsersProvider.name, __filename, deps);
  }

  async getUsersByGitlabId(args: { gitlabUserIds: number[] }): Promise<Map<number, IFullUser | undefined>> {
    const result = await this.deps.prisma.user.findMany({
      include: {
        emails: { select: { domain: true, email: true } },
        gitlabUser: { select: { id: true }, where: { id: { in: args.gitlabUserIds } } },
        slackUser: { select: { id: true } },
      },
    });

    return new Map(
      args.gitlabUserIds.map((id) => {
        return [id, result.find((v) => v.gitlabUser?.id === id)];
      }),
    );
  }

  async createUser(args: {
    gitlabUserId: number;
    slackUserId: string;
    emails: string[];
    timezone?: string;
    timezoneOffset?: number;
    locale?: string;
  }): Promise<IFullUser> {
    const result = await this.deps.prisma.user.create({
      include: {
        emails: { select: { domain: true, email: true } },
        gitlabUser: { select: { id: true } },
        slackUser: { select: { id: true } },
      },
      data: {
        timezone: args.timezone,
        timezoneOffset: args.timezoneOffset,
        locale: args.locale,
        gitlabUser: {
          connectOrCreate: {
            create: {
              id: args.gitlabUserId,
            },
            where: {
              id: args.gitlabUserId,
            },
          },
        },
        slackUser: {
          connectOrCreate: {
            create: {
              id: args.slackUserId,
            },
            where: {
              id: args.slackUserId,
            },
          },
        },
        emails: {
          createMany: {
            skipDuplicates: true,
            data: args.emails.map((email) => ({
              email,
              domain: email.split('@').pop() ?? '',
            })),
          },
        },
      },
    });

    return result;
  }

  async updateUser(args: {
    id: number;
    emails: string[];
    timezone?: string;
    timezoneOffset?: number;
    locale?: string;
  }): Promise<IFullUser> {
    // delete emails no longer present in profile
    await this.deps.prisma.userMail.deleteMany({
      where: {
        userId: args.id,
        email: {
          notIn: args.emails,
        },
      },
    });

    // const exsistingEmails = (
    //   await this.deps.prisma.userMail.findMany({
    //     where: {
    //       userId: args.id,
    //     },
    //   })
    // ).map((i) => i.email);

    // const emailsToAdd = args.emails.filter((i) => !exsistingEmails.includes(i));

    const result = await this.deps.prisma.user.update({
      include: {
        emails: { select: { domain: true, email: true } },
        gitlabUser: { select: { id: true } },
        slackUser: { select: { id: true } },
      },
      where: {
        id: args.id,
      },
      data: {
        timezone: args.timezone,
        timezoneOffset: args.timezoneOffset,
        locale: args.locale,
        emails: {
          createMany: {
            skipDuplicates: true,
            // data: emailsToAdd.map((email) => ({
            //   email,
            //   domain: email.split('@').pop() ?? '',
            // })),
            data: args.emails.map((email) => ({
              email,
              domain: email.split('@').pop() ?? '',
            })),
          },
        },
      },
    });

    return result;
  }
}
