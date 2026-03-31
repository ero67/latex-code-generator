import React from "react";
import * as AiIcons from "react-icons/ai";
import { FaTableCells } from "react-icons/fa6";
import { BsTreeFill, BsTree } from "react-icons/bs";
import { FaFileImage, FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export const useSidebarData = () => {
  const { t } = useTranslation();
  return [
    { title: t('nav.home'), path: "/", icon: <AiIcons.AiFillHome />, cName: "nav-text" },
    { title: t('nav.karnaugh_maps'), path: "/karnaugh-maps", icon: <FaTableCells />, cName: "nav-text" },
    { title: t('nav.abstract_syntax_trees'), path: "/ast", icon: <BsTreeFill />, cName: "nav-text" },
    { title: t('nav.proof_trees'), path: "/proof-trees", icon: <BsTree />, cName: "nav-text" },
    { title: t('nav.resolution_trees'), path: "/resolution-trees", icon: <BsTree />, cName: "nav-text" },
    { title: t('nav.finite_state_automata'), path: "/finite-state-automata", icon: <AiIcons.AiOutlineShareAlt />, cName: "nav-text" },
    { title: t('nav.image_to_latex'), path: "/image-to-latex", icon: <FaFileImage />, cName: "nav-text" },
  ];
};

export const useProfileSidebarData = () => {
  const { t } = useTranslation();
  return [
    { title: t('nav.profile'), path: "/profile", icon: <FaUser />, cName: "nav-text" },
  ];
};

// Keep backward-compatible static exports for any code that hasn't migrated yet
export const SidebarData = [
  { title: "Home", path: "/", icon: <AiIcons.AiFillHome />, cName: "nav-text" },
  { title: "Karnaugh maps", path: "/karnaugh-maps", icon: <FaTableCells />, cName: "nav-text" },
  { title: "Abstract syntax trees", path: "/ast", icon: <BsTreeFill />, cName: "nav-text" },
  { title: "Proof trees", path: "/proof-trees", icon: <BsTree />, cName: "nav-text" },
  { title: "Resolution trees", path: "/resolution-trees", icon: <BsTree />, cName: "nav-text" },
  { title: "Finite State Automata", path: "/finite-state-automata", icon: <AiIcons.AiOutlineShareAlt />, cName: "nav-text" },
  { title: "Image to LaTeX", path: "/image-to-latex", icon: <FaFileImage />, cName: "nav-text" },
];

export const ProfileSidebarData = [
  { title: "Profile", path: "/profile", icon: <FaUser />, cName: "nav-text" },
];
