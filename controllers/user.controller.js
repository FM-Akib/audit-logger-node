const user = [
  {
    id: 1,
    name: 'John',
  },
  {
    id: 2,
    name: 'Jane',
  },
];

export const getAllUsers = (req, res) => {
  res.status(200).json(user);
};
