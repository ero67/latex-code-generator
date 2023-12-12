import React from 'react';
// import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
// import * as IoIcons from 'react-icons/io';
import { FaTableCells } from "react-icons/fa6";
import { BsTreeFill } from "react-icons/bs";
import { BsTree } from "react-icons/bs";


export const SidebarData = [
  {
    title: 'Domov',
    path: '/',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text'
  },
  {
    title: 'Karnaughova mapa',
    path: '/karnaughove-mapy',
    icon: <FaTableCells/>,
    cName: 'nav-text'
  },
  {
    title: 'Abstraktné syntaktické stromy',
    path: '/abstraktne-syntakticke-stromy',
    icon: <BsTreeFill />,
    cName: 'nav-text'
  },
  {
    title: 'Dôkazové stromy',
    path: '/dokazove-stromy',
    icon: <BsTree />,
    cName: 'nav-text'
  }
  
];