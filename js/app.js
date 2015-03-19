(function ($) {

    //Демонстрационная модель
    var contacts = [
        { name: "Петя", lastname: "Грущенко", address: "Козакова 3б, кв 1", tel: "0123456789", email: "anemail@me.com", type: "14.04.1998" },
        { name: "Гриша", lastname: "Федченко", address: "Козакова 3б, кв 2", tel: "0123456789", email: "anemail@me.com", type: "25.02.1997" },
        { name: "Юра", lastname: "Радченко", address: "Козакова 3б, кв 3", tel: "0123456789", email: "anemail@me.com", type: "15.02.1990" },
        { name: "Федя", lastname: "Кузьменко", address: "Козакова 3б, кв 4", tel: "0123456789", email: "anemail@me.com", type: "14.04.1998" },
        { name: "Иван", lastname: "Дементеев", address: "Козакова 3б, кв 5", tel: "0123456789", email: "anemail@me.com", type: "14.04.1998" },
        { name: "Гузман", lastname: "Хузейнов", address: "Козакова 3б, кв 6", tel: "0123456789", email: "anemail@me.com", type: "15.02.1990" },
        { name: "Нестор", lastname: "Ракуев", address: "Козакова 3б, кв 7", tel: "0123456789", email: "anemail@me.com", type: "15.02.1990" },
        { name: "Посейдон", lastname: "Фешуев", address: "Козакова 3б, кв 1", tel: "0123456789", email: "anemail@me.com", type: "25.02.1997" }
    ];

    //Модель наших контаков
    var Contact = Backbone.Model.extend({
        defaults: {
            photo: "img/placeholder.png",
            name: "",
            address: "",
            tel: "",
            email: "",
            type: "",
            lastname: ""
        }
    });

    //Создаем переменную нашей коллекции
    var Directory = Backbone.Collection.extend({
        model: Contact

    });

    // Создаем отдельный вид для контакта
    var ContactView = Backbone.View.extend({
        tagName: "article",
        className: "contact-container",
        template: _.template($("#contactTemplate").html()),
        editTemplate: _.template($("#contactEditTemplate").html()),

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        events: {
            "click button.delete": "deleteContact",
            "click button.edit": "editContact",
            "change select.type": "addType",
            "click button.save": "saveEdits",
            "click button.cancel": "cancelEdit"
        },

        //Удаление контакта
        deleteContact: function () {
            var removedType = this.model.get("type").toLowerCase();

            //удаление модели
            this.model.destroy();

            //удаление со страницы
            this.remove();

            //Рендерим заново если удалили
            if (_.indexOf(directory.getTypes(), removedType) === -1) {
                directory.$el.find("#filter select").children("[value='" + removedType + "']").remove();
            }
        },

        //Режим редактирования контакта
        editContact: function () {
            this.$el.html(this.editTemplate(this.model.toJSON()));

            //add select to set type
            var newOpt = $("<option/>", {
                html: "<em>Add new...</em>",
                value: "addType"
            });
            this.select = directory.createSelect().addClass("type").val(this.$el.find("#type").val()).append(newOpt).insertAfter(this.$el.find(".name"));
            this.$el.find("input[type='hidden']").remove();
            
        },

        // Добавление даты рождения
        addType: function () {
            
            if (this.select.val() === "addType") {

                this.select.remove();

                $("<input />", {
                    "class": "type"
                }).insertAfter(this.$el.find(".name")).focus();
            }
        },
        //Сохранение в режиме редактирования контакта
        saveEdits: function (e) {
            e.preventDefault();

            var formData = {},
                prev = this.model.previousAttributes();

            //Получения формы данных
            $(e.target).closest("form").find(":input").not("button").each(function () {
                var el = $(this);
                formData[el.attr("class")] = el.val();
            });

            //Использования стандартного фото на случай отсутсвия
            if (formData.photo === "") {
                delete formData.photo;
            }

            //Перегрузка модели
            this.model.set(formData);

            //Рендерим вид
            this.render();

            
            if (prev.photo === "img/placeholder.png") {
                delete prev.photo;
            }

            //Обновления массива контакты
            _.each(contacts, function (contact) {
                if (_.isEqual(contact, prev)) {
                    contacts.splice(_.indexOf(contacts, contact), 1, formData);
                }
            });
        },

        cancelEdit: function () {
            this.render();
        }
    });

    //Создаем переменную вида контактов
    var DirectoryView = Backbone.View.extend({
        el: $("#contacts"),

        initialize: function () {
            this.collection = new Directory(contacts);

            this.render();
            this.$el.find("#filter").append(this.createSelect());

            this.on("change:filterType", this.filterByType, this);
            this.collection.on("reset", this.render, this);
            this.collection.on("add", this.renderContact, this);
            this.collection.on("remove", this.removeContact, this);
        },

        render: function () {
            this.$el.find("article").remove();

            _.each(this.collection.models, function (item) {
                this.renderContact(item);
            }, this);
        },

        renderContact: function (item) {
            var contactView = new ContactView({
                model: item
            });
            this.$el.append(contactView.render().el);
        },

        getTypes: function () {
            return _.uniq(this.collection.pluck("type"), false, function (type) {
                return type.toLowerCase();
            });
        },

        createSelect: function () {
            var filter = this.$el.find("#filter"),
                select = $("<select/>", {
                    html: "<option value='all'>All</option>"
                });

            _.each(this.getTypes(), function (item) {
                var option = $("<option/>", {
                    value: item.toLowerCase(),
                    text: item.toLowerCase()
                }).appendTo(select);
            });

            return select;
        },

        //Добавляем для интерфейса события
        events: {
            "change #filter select": "setFilter",
            "click #add": "addContact",
            "click #showForm": "showForm"
        },

        //Фильтр
        setFilter: function (e) {
            this.filterType = e.currentTarget.value;
            this.trigger("change:filterType");
        },

        //фильтр по дате рождения
        filterByType: function () {
            if (this.filterType === "all") {
                this.collection.reset(contacts);
                contactsRouter.navigate("filter/all");
            } else {
                this.collection.reset(contacts, { silent: true });

                var filterType = this.filterType,
                    filtered = _.filter(this.collection.models, function (item) {
                        return item.get("type").toLowerCase() === filterType;
                    });

                this.collection.reset(filtered);

                contactsRouter.navigate("filter/" + filterType);
            }
        },

        //добавление нового контакта
        addContact: function (e) {
            e.preventDefault();

            var formData = {};
            $("#addContact").children("input").each(function (i, el) {
                if ($(el).val() !== "") {
                    formData[el.id] = $(el).val();
                }
            });

            //обновления данных контакта
            contacts.push(formData);


            if (_.indexOf(this.getTypes(), formData.type) === -1) {
                this.collection.add(new Contact(formData));
                this.$el.find("#filter").find("select").remove().end().append(this.createSelect());
            } else {
                this.collection.add(new Contact(formData));
            }
        },

        removeContact: function (removedModel) {
            var removed = removedModel.attributes;

    
            if (removed.photo === "img/placeholder.png") {
                delete removed.photo;
            }


            _.each(contacts, function (contact) {
                if (_.isEqual(contact, removed)) {
                    contacts.splice(_.indexOf(contacts, contact), 1);
                }
            });
        },

        showForm: function () {
            this.$el.find("#addContact").slideToggle();
        }
    });

    //добавление роутов
    var ContactsRouter = Backbone.Router.extend({
        routes: {
            "filter/:type": "urlFilter"
        },

        urlFilter: function (type) {
            directory.filterType = type;
            directory.trigger("change:filterType");
        }
    });

    //создаем переменную вида
    var directory = new DirectoryView();

    //создаем переменную роутера
    var contactsRouter = new ContactsRouter();

    //сохраняем историю
    Backbone.history.start();

} (jQuery));
