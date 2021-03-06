/**
 * Layout component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql } from "gatsby"
import styled from "@emotion/styled"

import { MDXProvider } from "@mdx-js/react"
import CodeBlock from "./CodeBlock";
import { preToCodeBlock } from "mdx-utils";

import Header from "./header"
import Footer from "./footer"
import "./layout.css"


const components = {
  pre: (preProps) => {
    const props = preToCodeBlock(preProps)
    if (props) {
      return <CodeBlock {...props} />
    } else {
      return <pre {...preProps} />
    }
  },
}

const Content = styled.div`
  margin: 0 auto;
  max-width: 1024px;
  padding: 0 1.0875rem 1rem;
  padding-top: 0;
  background-color: ${(props) => (props.darkmode ? "#1A202C" : "#FFFFFF")};
`

const GatsbyLink = styled.a`
  margin-left: 5px;
`
const Layout = ({ children, darkmode }) => {
  return (
    <MDXProvider components={components}>
      <StaticQuery
        query={graphql`
          query SiteTitleQuery {
            site {
              siteMetadata {
                title
              }
            }
          }
        `}
        render={(data) => (
          <div style={{ backgroundColor: darkmode ? "#1A202C" : "#FFFFFF" }}>
            <Header siteTitle={data.site.siteMetadata.title} />
            <Content darkmode={darkmode}>
              <main>{children}</main>
              <Footer darkmode={darkmode}>
                <p>
                  © {new Date().getFullYear()}, Built with
                  {` `}
                </p>
                <GatsbyLink href="https://www.gatsbyjs.org">Gatsby</GatsbyLink>
              </Footer>
            </Content>
          </div>
        )}
      />
    </MDXProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
