'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('SmsName', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
}