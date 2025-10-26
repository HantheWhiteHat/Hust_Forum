const paginate = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    current: parseInt(page),
    pages: totalPages,
    total,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? parseInt(page) + 1 : null,
    prevPage: hasPrevPage ? parseInt(page) - 1 : null
  };
};

module.exports = { paginate };

