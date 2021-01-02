export default function gamesUserModel(sequelize, DataTypes) {
  return sequelize.define(
    'gamesUser',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      gameId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'games',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      hand: {
        type: DataTypes.JSON,
      },
      playerNum: {
        type: DataTypes.INTEGER,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      // timestamps: false prevents Sequelize from adding
      // createdAt and updatedAt timestamp fields
      // https://sequelize.org/master/class/lib/model.js~Model.html#static-method-init
      timestamps: false,
    },
  );
}
