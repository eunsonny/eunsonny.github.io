/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it

/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it

const path = require(`path`)
const _ = require('lodash')
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `Mdx`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

exports.createPages = ({ graphql, actions, reporter }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve(`src/templates/blog-post.js`)
  const tagTemplate = path.resolve('src/templates/tags.js')

  return graphql(`
    {
      allMdx {
        edges {
          node {
            frontmatter {
              path
              draft
              date
              tags
            }
            fields {
              slug
            }
          }
        }
      }
      tagsGroup: allMdx(limit:2000)  {
        group(field: frontmatter___tags) {
          fieldValue
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }
    result.data.allMdx.edges
      .filter(({ node }) => !node.frontmatter.draft)
      .forEach(({ node }) => {
        createPage({
          path: node.frontmatter.path,
          component: blogPostTemplate,
          slug: node.fields.slug,
          context: {},
        })
      })
    result.data.tagsGroup.group
      .forEach(tag => {
        createPage({
          path: `/tags/${_.kebabCase(tag.fieldValue)}/`,
          component: tagTemplate,
          context: {
            tag: tag.fieldValue,
          },
        })
      })  
  })
}
