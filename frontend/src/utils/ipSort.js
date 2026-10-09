export const ipSort = (ip1, ip2, asc = true) => {
  const num1 = Number(ip1.split(".").map((d) => ("000" + d).slice(-3)).join(""));
  const num2 = Number(ip2.split(".").map((d) => ("000" + d).slice(-3)).join(""));
  return asc ? num1 - num2 : num2 - num1;
};
