"use client";
import React from "react";

const Breadcrumb = ({ path }) => (
  <nav className="text-white text-sm mt-1 text-center opacity-80">
    {path.map((item, index) => (
      <span key={index}>
        {item}
        {index < path.length - 1 && " / "}
      </span>
    ))}
  </nav>
);

const HeaderMahasiswaCourse = ({ title, path }) => {
  return (
    <div className="pt-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 min-h-[420px] flex flex-col justify-center items-center text-white">
      <h1 className="text-4xl font-bold mb-4 text-center">{title}</h1>
      <Breadcrumb path={path} />
    </div>
  );
};

export default HeaderMahasiswaCourse;
