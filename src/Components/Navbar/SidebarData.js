import React from 'react';
// import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
// import * as IoIcons from 'react-icons/io';
import { FaTableCells } from "react-icons/fa6";
import { BsTreeFill } from "react-icons/bs";
import { BsTree } from "react-icons/bs";


export const SidebarData = [
  {
    title: 'Home',
    path: '/latex-code-generator',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text'
  },
  {
    title: 'Karnaugh maps',
    path: '/latex-code-generator/karnaugh-maps',
    icon: <FaTableCells/>,
    cName: 'nav-text'
  },
  {
    title: 'Abstract syntax trees',
    path: '/latex-code-generator/ast',
    icon: <BsTreeFill />,
    cName: 'nav-text'
  },
  {
    title: 'Proof trees',
    path: '/latex-code-generator/proof-trees',
    icon: <BsTree />,
    cName: 'nav-text'
  }
  
];