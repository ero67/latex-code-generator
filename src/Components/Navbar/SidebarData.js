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
    path: '/',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text'
  },
  {
    title: 'Karnaugh maps',
    path: '/karnaugh-maps',
    icon: <FaTableCells/>,
    cName: 'nav-text'
  },
  {
    title: 'Abstract syntax trees',
    path: '/ast',
    icon: <BsTreeFill />,
    cName: 'nav-text'
  },
  {
    title: 'Proof trees',
    path: '/proof-trees',
    icon: <BsTree />,
    cName: 'nav-text'
  }
  
];