import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  collections: {
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({
          label: 'Description',
          validation: { isRequired: true },
        }),
        pubDate: fields.datetime({ label: 'Publication Date' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        draft: fields.checkbox({
          label: 'Draft',
          defaultValue: false,
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            bold: true,
            italic: true,
            strikethrough: true,
            code: true,
            heading: [2, 3, 4],
            blockquote: true,
            orderedList: true,
            unorderedList: true,
            table: false,
            link: true,
            divider: true,
            codeBlock: true,
          },
        }),
      },
    }),
  },
});
