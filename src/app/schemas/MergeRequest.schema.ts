import { Static, Type } from '@fastify/type-provider-typebox';

export const MergeRequestSchema = Type.Object({
  assignees: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.Number(),
        name: Type.String({ description: 'Full name' }),
        username: Type.String({ description: 'Gitlab nickname' }),
        avatar_url: Type.String({ description: 'User avatar url' }),
      }),
    ),
  ),
  event_type: Type.Union([Type.Literal('merge_request')]),
  object_attributes: Type.Object({
    id: Type.Number(),
    assignee_ids: Type.Array(Type.Number()),
    author_id: Type.Number(),
    action: Type.Optional(
      Type.Union(
        [
          Type.Literal('open'),
          Type.Literal('close'),
          Type.Literal('reopen'),
          Type.Literal('update'),
          Type.Literal('approved'),
          Type.Literal('unapproved'),
          Type.Literal('approval'),
          Type.Literal('unapproval'),
          Type.Literal('merge'),
        ],
        { description: 'Action that was performed by user' },
      ),
    ),
    detailed_merge_status: Type.Union([
      Type.Literal('not_open'),
      Type.Literal('not_approved'),
      Type.Literal('discussions_not_resolved'),
      Type.Literal('mergeable'),
      Type.Literal('checking'),
      Type.Literal('unchecked'),
    ]),
    description: Type.Optional(Type.String()),
    draft: Type.Boolean(),
    reviewer_ids: Type.Array(Type.Number()),
    source_branch: Type.String(),
    state: Type.Union([
      // opened , closed , locked , or merged
      Type.Literal('merged'),
      Type.Literal('opened'),
      Type.Literal('locked'),
      Type.Literal('merged'),
    ]),

    target_branch: Type.String(),
    title: Type.String(),
    url: Type.String({ description: 'Merge request url' }),
    work_in_progress: Type.Boolean(),
  }),
  // object_kind: Type.String(),
  object_kind: Type.Union([Type.Literal('merge_request')]),
  project: Type.Object({
    id: Type.Number(),
    name: Type.String(),
    namespace: Type.String(),
    path_with_namespace: Type.String(),
    avatar_url: Type.Union([Type.String(), Type.Null()]), // Actually could be null or empty string
    homepage: Type.String({ description: 'Homepage url' }),
    web_url: Type.String({ description: 'Some web url, maybe use instead of homepage' }),
  }),
  reviewers: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.Number(),
        name: Type.String({ description: 'Full name' }),
        username: Type.String({ description: 'Gitlab nickname' }),
        avatar_url: Type.String({ description: 'User avatar url' }),
      }),
    ),
  ),
  user: Type.Object(
    {
      id: Type.Number(),
      name: Type.String({ description: 'Full name' }),
      username: Type.String({ description: 'Gitlab nickname' }),
      avatar_url: Type.String({ description: 'User avatar url' }),
    },
    { description: 'User who performed the action' },
  ),
  changes: Type.Object({
    draft: Type.Optional(
      Type.Object({
        previous: Type.Boolean(),
        current: Type.Boolean(),
      }),
    ),
  }),
});

export type TMergeRequest = Static<typeof MergeRequestSchema>;
