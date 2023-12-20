class ApiFeatures {
    public query: any;
    public queryStr: any;

    constructor(query: any, queryStr: any) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search(): ApiFeatures {
        const keyword = this.queryStr.keyword ?
            {
                name: {
                    $regex: this.queryStr.keyword,
                    $options: "i"
                },
            } : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter(): ApiFeatures {
        const queryCopy = { ...this.queryStr };

        const removeFields: string[] = ["keyword", "page", "limit"];

        removeFields.forEach((key) => delete queryCopy[key]);

        let queryStr: string = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    pagination(resultPerPage: number): ApiFeatures {
        const currentPage: number = Number(this.queryStr.page) || 1;

        const skip: number = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);

        return this;
    }
}

export = ApiFeatures;
