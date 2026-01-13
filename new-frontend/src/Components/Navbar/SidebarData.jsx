import React from "react";
// import * as FaIcons from 'react-icons/fa';
import * as AiIcons from "react-icons/ai";
// import * as IoIcons from 'react-icons/io';
import { FaTableCells } from "react-icons/fa6";
import { BsTreeFill } from "react-icons/bs";
import { BsTree } from "react-icons/bs";
import { FaFileImage } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

export const SidebarData = [
  {
    title: "Home",
    path: "/",
    icon: <AiIcons.AiFillHome />,
    cName: "nav-text",
  },
  {
    title: "Karnaugh maps",
    path: "/karnaugh-maps",
    icon: <FaTableCells />,
    cName: "nav-text",
  },
  {
    title: "Abstract syntax trees",
    path: "/ast",
    icon: <BsTreeFill />,
    cName: "nav-text",
  },
  {
    title: "Proof trees",
    path: "/proof-trees",
    icon: <BsTree />,
    cName: "nav-text",
  },
  {
    title: "Resolution trees",
    path: "/resolution-trees",
    icon: <BsTree />,
    cName: "nav-text",
  },
  {
    title: "Finite State Automata",
    path: "/finite-state-automata",
    icon: <AiIcons.AiOutlineShareAlt />,
    cName: "nav-text",
  },
  {
    title: "Image to LaTeX",
    path: "/image-to-latex",
    icon: <FaFileImage />,
    cName: "nav-text",
  },
];

export const ProfileSidebarData = [
  {
    title: "Profile",
    path: "/profile",
    icon: <FaUser />,
    cName: "nav-text",
  },
];
