'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    id: {
        type: DataTypes.STRING, // Google profile ID, lưu dưới dạng chuỗi
        primaryKey: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    typeLogin: {
        type: DataTypes.STRING,
        allowNull: true, // Có thể để null, sẽ chứa giá trị provider (vd: "google")
    }
}, {
    timestamps: true // Nếu bạn muốn thêm cột `createdAt` và `updatedAt`
});
return Users;
};