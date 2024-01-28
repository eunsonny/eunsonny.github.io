import React from "react";

import classNames from "classnames";
import { Link } from "gatsby";

import { Image } from "@/components/Image";
import { useSiteMetadata } from "@/hooks";

import * as styles from "./Pagination.module.scss";

type Props = {
  prevPagePath: string;
  nextPagePath: string;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

const Pagination = ({
  prevPagePath,
  nextPagePath,
  hasNextPage,
  hasPrevPage,
}: Props) => {
  const { icons } = useSiteMetadata();

  const prevClassName = classNames(styles.previousLink, {
    [styles.disable]: !hasPrevPage,
  });

  const nextClassName = classNames(styles.nextLink, {
    [styles.disable]: !hasNextPage,
  });

  return (
    <div className={styles.pagination}>
      <div className={styles.previous}>
        <Link
          rel="prev"
          to={hasPrevPage ? prevPagePath : "/"}
          className={prevClassName}
        >
          <Image alt={"이전"} path={icons.leftArrow} className={styles.arrow} />
        </Link>
      </div>
      <div className={styles.next}>
        <Link
          rel="next"
          to={hasNextPage ? nextPagePath : "/"}
          className={nextClassName}
        >
          <Image
            alt={"다음"}
            path={icons.rightArrow}
            className={styles.arrow}
          />
        </Link>
      </div>
    </div>
  );
};

export default Pagination;
