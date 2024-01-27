import React, { Children, ReactNode } from "react";

import cn from "classnames";
import { Link } from "gatsby";

import * as styles from "./Button.module.scss";

interface Props {
  className?: string;
  title?: string;
  to: string;
  children?: ReactNode;
}

const Button: React.FC<Props> = ({ className, title, to, children }: Props) => (
  <Link className={cn(styles.button, className)} to={to}>
    {title ? title : children}
  </Link>
);

export default Button;
