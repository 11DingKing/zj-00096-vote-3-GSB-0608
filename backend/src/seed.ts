import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './users/entities/user.entity';
import { Poll } from './polls/entities/poll.entity';
import { Option } from './polls/entities/option.entity';
import { Vote } from './polls/entities/vote.entity';
import { Template } from './templates/entities/template.entity';
import { Comment } from './comments/entities/comment.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Role } from './common/enums/role.enum';
import { PollType } from './common/enums/poll-type.enum';
import { PollStatus } from './common/enums/poll-status.enum';

const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './data/app.db',
  entities: [User, Poll, Option, Vote, Template, Comment, Notification],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Data Source initialized');

  const userRepository = AppDataSource.getRepository(User);
  const pollRepository = AppDataSource.getRepository(Poll);
  const optionRepository = AppDataSource.getRepository(Option);
  const voteRepository = AppDataSource.getRepository(Vote);
  const templateRepository = AppDataSource.getRepository(Template);

  await voteRepository.clear();
  await optionRepository.clear();
  await pollRepository.clear();
  await userRepository.clear();
  await templateRepository.clear();

  const hashedPassword = await bcrypt.hash('admin123456', 10);
  const hashedCreatorPassword = await bcrypt.hash('creator123456', 10);
  const hashedVoterPassword = await bcrypt.hash('voter123456', 10);

  const admin = userRepository.create({
    username: 'admin',
    password: hashedPassword,
    name: 'Admin User',
    role: Role.ADMIN,
    weight: 3,
  });
  await userRepository.save(admin);

  const creator1 = userRepository.create({
    username: 'creator1',
    password: hashedCreatorPassword,
    name: 'Creator One',
    role: Role.CREATOR,
    weight: 2,
  });
  await userRepository.save(creator1);

  const voters = [];
  for (let i = 1; i <= 5; i++) {
    const voter = userRepository.create({
      username: `voter${i}`,
      password: hashedVoterPassword,
      name: `Voter ${i}`,
      role: Role.VOTER,
      weight: 1,
    });
    voters.push(await userRepository.save(voter));
  }
  console.log('Users created');

  const templates = [
    {
      name: '团建活动投票',
      description: '用于选择团队建设活动地点',
      type: PollType.SINGLE_CHOICE,
      defaultOptions: ['户外拓展', '烧烤聚餐', 'KTV唱歌', '桌游聚会', '密室逃脱'],
      isAnonymous: true,
      isPublic: true,
    },
    {
      name: '午餐选择',
      description: '投票决定今天的午餐',
      type: PollType.MULTIPLE_CHOICE,
      defaultOptions: ['中餐', '西餐', '日料', '韩餐', '快餐'],
      isAnonymous: true,
      isPublic: true,
    },
    {
      name: '方案评审',
      description: '对多个方案进行排序评审',
      type: PollType.RANKING,
      defaultOptions: ['方案A', '方案B', '方案C', '方案D'],
      isAnonymous: false,
      isPublic: true,
    },
    {
      name: '年度评优',
      description: '对候选人进行加权评分',
      type: PollType.WEIGHTED,
      defaultOptions: ['候选人1', '候选人2', '候选人3'],
      isAnonymous: false,
      isPublic: false,
    },
    {
      name: '满意度调查',
      description: '对服务进行1-10分评分',
      type: PollType.RATING,
      defaultOptions: ['服务质量', '响应速度', '专业程度', '性价比'],
      isAnonymous: true,
      isPublic: true,
    },
  ];

  for (const t of templates) {
    const template = templateRepository.create(t);
    await templateRepository.save(template);
  }
  console.log('Templates created');

  const polls: Poll[] = [];

  const poll1 = pollRepository.create({
    title: '季度团建活动选择',
    description: '请投票选择本季度团队建设活动',
    type: PollType.SINGLE_CHOICE,
    creator: creator1,
    status: PollStatus.ACTIVE,
    isAnonymous: true,
    isPublic: true,
    maxVotesPerUser: 1,
  });
  poll1.options = [
    optionRepository.create({ name: '户外拓展', description: '郊外团建活动' }),
    optionRepository.create({ name: '烧烤聚餐', description: '自助烧烤' }),
    optionRepository.create({ name: '温泉度假', description: '温泉酒店' }),
  ];
  polls.push(await pollRepository.save(poll1));

  const poll2 = pollRepository.create({
    title: '项目技术栈选型',
    description: '请选择新项目的技术栈（可多选）',
    type: PollType.MULTIPLE_CHOICE,
    creator: admin,
    status: PollStatus.ACTIVE,
    isAnonymous: false,
    isPublic: true,
    maxVotesPerUser: 3,
  });
  poll2.options = [
    optionRepository.create({ name: 'React', description: '前端框架' }),
    optionRepository.create({ name: 'Vue', description: '前端框架' }),
    optionRepository.create({ name: 'Node.js', description: '后端' }),
    optionRepository.create({ name: 'Python', description: '后端' }),
  ];
  polls.push(await pollRepository.save(poll2));

  const poll3 = pollRepository.create({
    title: '产品功能优先级排序',
    description: '请对以下功能按优先级排序',
    type: PollType.RANKING,
    creator: creator1,
    status: PollStatus.ACTIVE,
    isAnonymous: false,
    isPublic: true,
    maxVotesPerUser: 1,
  });
  poll3.options = [
    optionRepository.create({ name: '用户认证', description: '登录注册功能' }),
    optionRepository.create({ name: '数据导出', description: 'CSV/PDF导出' }),
    optionRepository.create({ name: '消息通知', description: '邮件/短信通知' }),
    optionRepository.create({ name: '数据分析', description: '报表统计' }),
  ];
  polls.push(await pollRepository.save(poll3));

  const poll4 = pollRepository.create({
    title: '员工满意度评分',
    description: '请对各项满意度进行评分（1-10分）',
    type: PollType.RATING,
    creator: admin,
    status: PollStatus.ACTIVE,
    isAnonymous: true,
    isPublic: false,
    maxVotesPerUser: 1,
  });
  poll4.options = [
    optionRepository.create({ name: '工作环境' }),
    optionRepository.create({ name: '薪资待遇' }),
    optionRepository.create({ name: '团队氛围' }),
    optionRepository.create({ name: '发展空间' }),
  ];
  polls.push(await pollRepository.save(poll4));

  const poll5 = pollRepository.create({
    title: '年度优秀员工评选',
    description: '请为候选人投票（管理层权重更高）',
    type: PollType.WEIGHTED,
    creator: admin,
    status: PollStatus.ACTIVE,
    isAnonymous: false,
    isPublic: false,
    maxVotesPerUser: 1,
  });
  poll5.options = [
    optionRepository.create({ name: '张三', description: '前端开发' }),
    optionRepository.create({ name: '李四', description: '后端开发' }),
    optionRepository.create({ name: '王五', description: '产品经理' }),
  ];
  polls.push(await pollRepository.save(poll5));

  console.log('Polls created');

  const allUsers = [admin, creator1, ...voters];
  for (const poll of polls) {
    const voteCount = Math.floor(Math.random() * 6) + 15;
    for (let i = 0; i < voteCount; i++) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomOptions = [...poll.options].sort(() => Math.random() - 0.5);

      if (poll.type === PollType.SINGLE_CHOICE || poll.type === PollType.WEIGHTED) {
        const vote = voteRepository.create({
          poll,
          option: randomOptions[0],
          user: poll.isAnonymous ? null : user,
          weight: user.weight,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        });
        await voteRepository.save(vote);
      } else if (poll.type === PollType.MULTIPLE_CHOICE) {
        const selectedCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < selectedCount; j++) {
          const vote = voteRepository.create({
            poll,
            option: randomOptions[j],
            user: poll.isAnonymous ? null : user,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          });
          await voteRepository.save(vote);
        }
      } else if (poll.type === PollType.RANKING) {
        for (let j = 0; j < randomOptions.length; j++) {
          const vote = voteRepository.create({
            poll,
            option: randomOptions[j],
            user: poll.isAnonymous ? null : user,
            rankValue: j + 1,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          });
          await voteRepository.save(vote);
        }
      } else if (poll.type === PollType.RATING) {
        for (const option of poll.options) {
          const vote = voteRepository.create({
            poll,
            option,
            user: poll.isAnonymous ? null : user,
            ratingValue: Math.floor(Math.random() * 6) + 5,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          });
          await voteRepository.save(vote);
        }
      }
    }
  }
  console.log('Votes created');

  console.log('Seed completed!');
  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error during seed:', error);
  process.exit(1);
});
