import React from "react";

import { Button } from "@/components/Button";
import { Image } from "@/components/Image";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useSiteMetadata } from "@/hooks";
import type { Node } from "@/types";

import { Author } from "./Author";
import { Comments } from "./Comments";
import { Content } from "./Content";
import { Meta } from "./Meta";
import { Tags } from "./Tags";

import * as styles from "./Post.module.scss";

interface Props {
  post: Node;
}

const Post: React.FC<Props> = ({ post }: Props) => {
  const { icons } = useSiteMetadata();
  const { html } = post;
  const { tagSlugs, slug } = post.fields;
  const { tags, title, date } = post.frontmatter;

  return (
    <div className={styles.post}>
      <div className={styles.buttons}>
        <Button className={styles.buttonArticles} to="/">
          <Image path={icons.upRightArrow} alt={"모든 포스트"} />
          <span>All Posts</span>
        </Button>
        <ThemeSwitcher />
      </div>

      <div className={styles.content}>
        <Content body={html} title={title} />
      </div>

      <div className={styles.footer}>
        <Comments />
        {/* <span>맨 위로 올라가기</span> */}
        {/* <Meta date={date} /> */}
        {/* {tags && tagSlugs && <Tags tags={tags} tagSlugs={tagSlugs} />} */}
        {/* <Author /> */}
      </div>

      {/* <div className={styles.comments}>
        <Comments postSlug={slug} postTitle={post.frontmatter.title} />
      </div> */}
    </div>
  );
};

export default Post;
